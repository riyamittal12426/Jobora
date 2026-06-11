import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on the server.');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function parseJsonResponse(content) {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Groq returned a non-JSON response.');
  }
  return JSON.parse(jsonMatch[0]);
}

async function chatJson(systemPrompt, userPrompt, temperature = 0.4) {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq.');
  return parseJsonResponse(content);
}

function buildResumeContext(resumeData) {
  const text = (resumeData.resumeText || '').slice(0, 12000);
  return `
RESUME SUMMARY: ${resumeData.resumeSummary || 'N/A'}
EXPERIENCE LEVEL: ${resumeData.experienceLevel || 'Mid'}
SKILLS: ${(resumeData.foundSkills || []).join(', ') || 'None listed'}
STRENGTHS: ${(resumeData.strengths || []).join('; ') || 'N/A'}
WEAKNESSES: ${(resumeData.weaknesses || []).join('; ') || 'N/A'}
MISSING SKILLS: ${(resumeData.missingSkills || []).join(', ') || 'N/A'}

FULL RESUME TEXT:
${text}
`.trim();
}

export async function generateInterviewQuestions(resumeData, settings) {
  const systemPrompt = `You are a senior technical interviewer from a top tech company (Google, Amazon, Microsoft level).
Generate personalized mock interview questions STRICTLY based on the candidate's resume.
Rules:
- Every question MUST reference specific technologies, projects, tools, or achievements from their resume.
- NEVER ask generic questions like "Tell me about yourself" unless resume-specific context is woven in.
- Match difficulty: Easy = fundamentals on their stack; Medium = applied/scenario; Hard = system design depth on their domain.
- Interview types: Technical = coding/architecture on their stack; HR = behavioral tied to resume achievements; Project-Based = deep dive their listed projects; Scenario-Based = real-world problems using their tools; Mixed = blend all types.
- Return ONLY valid JSON with this exact shape:
{
  "questions": [
    {
      "id": "q1",
      "text": "question string",
      "category": "Technical|HR|Project|Scenario",
      "focusArea": "specific skill or project from resume",
      "resumeReference": "exact technology/project/achievement referenced"
    }
  ]
}`;

  const userPrompt = `
TARGET ROLE: ${settings.targetRole}
DIFFICULTY: ${settings.difficulty}
INTERVIEW TYPE: ${settings.interviewType}
NUMBER OF QUESTIONS: ${settings.questionCount}

${buildResumeContext(resumeData)}

Generate exactly ${settings.questionCount} unique, resume-specific questions ordered from warm-up to challenging.
`.trim();

  const result = await chatJson(systemPrompt, userPrompt, 0.5);
  if (!Array.isArray(result.questions) || result.questions.length === 0) {
    throw new Error('Groq did not return valid interview questions.');
  }
  return result.questions.slice(0, settings.questionCount);
}

export async function evaluateInterviewAnswer(resumeData, settings, question, answer) {
  const systemPrompt = `You are a senior technical interviewer evaluating a mock interview answer.
Score each criterion from 0-10. Be fair but rigorous like a FAANG interviewer.
Return ONLY valid JSON:
{
  "technicalAccuracy": number,
  "communicationSkills": number,
  "problemSolving": number,
  "depthOfKnowledge": number,
  "confidenceLevel": number,
  "relevance": number,
  "internalNotes": "brief evaluator notes — not shown to candidate during interview"
}`;

  const userPrompt = `
TARGET ROLE: ${settings.targetRole}
DIFFICULTY: ${settings.difficulty}

QUESTION: ${question.text}
QUESTION FOCUS: ${question.focusArea || 'General'}
RESUME REFERENCE: ${question.resumeReference || 'N/A'}

CANDIDATE ANSWER:
${answer}

RESUME CONTEXT (for relevance scoring):
${buildResumeContext(resumeData)}
`.trim();

  return chatJson(systemPrompt, userPrompt, 0.3);
}

export async function generateFinalInterviewReport(resumeData, settings, qaRecords) {
  const systemPrompt = `You are a senior hiring manager producing a final mock interview assessment report.
Analyze all Q&A records and produce a comprehensive, actionable report.
Return ONLY valid JSON with this exact structure:
{
  "overallScore": number (0-100),
  "technicalScore": number (0-100),
  "communicationScore": number (0-100),
  "problemSolvingScore": number (0-100),
  "confidenceScore": number (0-100),
  "resumeAlignmentScore": number (0-100),
  "interviewReadinessLevel": "Excellent"|"Good"|"Average"|"Needs Improvement",
  "readinessPercentage": number (0-100),
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improvementAreas": ["string"],
  "missingSkills": ["string"],
  "roleFitAnalysis": "detailed paragraph",
  "recruiterFeedback": "detailed paragraph written as a recruiter",
  "learningRoadmap": [
    { "topic": "string", "priority": "High|Medium|Low", "resources": "string", "timeline": "string" }
  ],
  "aiFeedbackSummary": "concise executive summary",
  "questionBreakdown": [
    {
      "questionIndex": number,
      "question": "string",
      "answer": "string",
      "overallQuestionScore": number (0-100),
      "scores": {
        "technicalAccuracy": number,
        "communicationSkills": number,
        "problemSolving": number,
        "depthOfKnowledge": number,
        "confidenceLevel": number,
        "relevance": number
      },
      "whatWasGood": "string",
      "whatWasMissing": "string",
      "idealAnswerExample": "string"
    }
  ]
}`;

  const qaSummary = qaRecords.map((record, index) => `
--- Q${index + 1} ---
Question: ${record.question}
Answer: ${record.answer}
Evaluator Scores: TA=${record.evaluation?.technicalAccuracy}, Comm=${record.evaluation?.communicationSkills}, PS=${record.evaluation?.problemSolving}, Depth=${record.evaluation?.depthOfKnowledge}, Conf=${record.evaluation?.confidenceLevel}, Rel=${record.evaluation?.relevance}
Notes: ${record.evaluation?.internalNotes || 'N/A'}
`).join('\n');

  const userPrompt = `
TARGET ROLE: ${settings.targetRole}
DIFFICULTY: ${settings.difficulty}
INTERVIEW TYPE: ${settings.interviewType}

${buildResumeContext(resumeData)}

INTERVIEW TRANSCRIPT & INTERNAL EVALUATIONS:
${qaSummary}

Produce the final assessment report. questionBreakdown must include every question with ideal answer examples tailored to the candidate's resume and target role.
`.trim();

  return chatJson(systemPrompt, userPrompt, 0.35);
}
