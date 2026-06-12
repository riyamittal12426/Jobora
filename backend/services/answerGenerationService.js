/**
 * AI Answer Generation Service
 * Generates tailored answers for custom application questions using Groq,
 * with MD5-based caching to reduce API calls and improve speed.
 */

import AnswerCache from '../models/AnswerCache.js';
import { chatJson, FAST_MODEL, PRIMARY_MODEL } from './jobGroqService.js';

const ANSWER_SYSTEM = `You are an elite AI job application assistant.
Generate a concise, professional, and highly tailored response to the screening question.
Use specific details from the candidate's resume, skills, and experience. Do not fabricate accomplishments.
Return ONLY valid JSON:
{
  "answer": "The complete response (1-2 concise paragraphs, professional tone)",
  "confidenceScore": number (0-100, how well the candidate's profile supports this answer),
  "explanation": "Brief note on which resume details were used"
}`;

/**
 * Generate (or retrieve cached) answer for a single custom question.
 */
export async function generateAnswer(question, candidateProfile, jobInfo, resumeAnalysis) {
  if (!question || !question.trim()) {
    return { answer: '', confidenceScore: 0, explanation: 'Empty question', cached: false };
  }

  const questionHash = AnswerCache.hashQuestion(question);

  // ─── Check Cache ────────────────────────────────────────────
  try {
    const cached = await AnswerCache.findOne({
      userEmail: candidateProfile.email || candidateProfile.userEmail,
      questionHash
    });

    if (cached) {
      // Cache hit — check if answer is still fresh (< 7 days for same-ish job type)
      const ageMs = Date.now() - cached.updatedAt.getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (ageMs < sevenDays) {
        cached.usageCount += 1;
        await cached.save();
        console.log(`[AnswerGen] Cache HIT for question hash ${questionHash.slice(0, 8)}... (usage: ${cached.usageCount})`);
        return {
          answer: cached.answer,
          confidenceScore: cached.confidenceScore,
          explanation: cached.explanation,
          cached: true
        };
      }
    }
  } catch (err) {
    console.warn('[AnswerGen] Cache lookup failed, generating fresh answer:', err.message);
  }

  // ─── Generate Fresh Answer ──────────────────────────────────
  const profileSnapshot = { ...candidateProfile };
  delete profileSnapshot.resumeText;

  const userPrompt = `
CANDIDATE PROFILE:
${JSON.stringify(profileSnapshot, null, 2)}

JOB DETAILS:
Title: ${jobInfo?.title || 'N/A'}
Company: ${jobInfo?.company || 'N/A'}
Description: ${(jobInfo?.description || '').slice(0, 3000)}

${resumeAnalysis ? `RESUME ANALYSIS SUMMARY:
Skills: ${(resumeAnalysis.foundSkills || []).join(', ')}
Experience Level: ${resumeAnalysis.experienceLevel || 'N/A'}
Strengths: ${(resumeAnalysis.strengths || []).join(', ')}
Overall Score: ${resumeAnalysis.overallScore || 'N/A'}` : ''}

SCREENING QUESTION:
"${question}"
  `.trim();

  const result = await chatJson(ANSWER_SYSTEM, userPrompt, FAST_MODEL, 0.4);
  const answer = result.answer || result.Answer || result.response || '';
  const confidenceScore = result.confidenceScore || result.confidence || 80;
  const explanation = result.explanation || 'Generated from resume and job description.';

  // ─── Store in Cache ─────────────────────────────────────────
  try {
    await AnswerCache.findOneAndUpdate(
      { userEmail: candidateProfile.email || candidateProfile.userEmail, questionHash },
      {
        $set: {
          questionText: question,
          jobTitle: jobInfo?.title || '',
          company: jobInfo?.company || '',
          answer,
          confidenceScore,
          explanation,
          usageCount: 1,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      { upsert: true, new: true }
    );
    console.log(`[AnswerGen] Cached answer for hash ${questionHash.slice(0, 8)}...`);
  } catch (err) {
    console.warn('[AnswerGen] Failed to cache answer:', err.message);
  }

  return { answer, confidenceScore, explanation, cached: false };
}

/**
 * Generate answers for multiple custom questions in batch.
 * Processes sequentially to respect Groq rate limits.
 */
export async function generateBatchAnswers(questions, candidateProfile, jobInfo, resumeAnalysis) {
  const results = [];
  for (const q of questions) {
    try {
      const result = await generateAnswer(q, candidateProfile, jobInfo, resumeAnalysis);
      results.push({ question: q, ...result });
    } catch (err) {
      console.error(`[AnswerGen] Failed to generate answer for "${q.slice(0, 50)}...":`, err.message);
      results.push({
        question: q,
        answer: '',
        confidenceScore: 0,
        explanation: `Generation failed: ${err.message}`,
        cached: false
      });
    }
  }
  return results;
}
