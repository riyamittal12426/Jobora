import Groq from 'groq-sdk';

export const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
export const FAST_MODEL = 'llama-3.1-8b-instant';

function getClient() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured.');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function parseJson(content) {
  const match = content.trim().match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid JSON from Groq');
  return JSON.parse(match[0]);
}

export async function chatJson(system, user, model = PRIMARY_MODEL, temperature = 0.35, retries = 3, delayMs = 2000) {
  const groq = getClient();
  let currentModel = model;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: currentModel,
        temperature,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      });
      const content = res.choices[0]?.message?.content;
      if (!content) throw new Error('Empty Groq response');
      return parseJson(content);
    } catch (error) {
      const isRateLimit = error.status === 429 || 
                          error.message?.includes('429') || 
                          error.message?.includes('rate_limit') ||
                          error.message?.includes('Rate limit reached');
      
      if (isRateLimit && attempt < retries) {
        if (currentModel === PRIMARY_MODEL) {
          console.warn(`[Groq API] Rate limit hit for ${PRIMARY_MODEL}. Falling back to ${FAST_MODEL} immediately...`);
          currentModel = FAST_MODEL;
          continue;
        }
        
        let waitTimeMs = delayMs * Math.pow(2, attempt - 1);
        const match = error.message?.match(/try again in ([\d.]+)\s*s/i);
        if (match) {
          const seconds = parseFloat(match[1]);
          waitTimeMs = Math.ceil((seconds + 1) * 1000);
        }
        
        console.warn(`[Groq API] Rate limit hit for ${currentModel}. Retrying in ${waitTimeMs}ms... (Attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
        continue;
      }
      throw error;
    }
  }
}

export function buildCandidateProfile(resumeData) {
  const full = resumeData.fullAnalysis || {};
  return {
    skills: resumeData.foundSkills || [],
    experienceLevel: resumeData.experienceLevel || 'Mid',
    strengths: resumeData.strengths || [],
    weaknesses: resumeData.weaknesses || [],
    missingSkills: resumeData.missingSkills || [],
    atsScore: full.atsScore ?? resumeData.overallScore ?? 0,
    technicalScore: resumeData.technicalScore ?? full.technicalScore ?? 0,
    experienceScore: resumeData.experienceScore ?? full.experienceScore ?? 0,
    resumeSummary: resumeData.resumeSummary || '',
    resumeText: (resumeData.resumeText || '').slice(0, 8000),
    wordCount: resumeData.wordCount || 0,
    metricsCount: resumeData.metricsCount || 0,
  };
}

const MATCH_SYSTEM = `You are a senior technical recruiter at a top tech company.
Analyze how well a candidate matches a specific job posting based on their resume profile.
Return ONLY valid JSON:
{
  "matchScore": number (0-100),
  "hiringProbability": "High"|"Medium"|"Low",
  "roleFitScore": number (0-100),
  "skillAlignmentScore": number (0-100),
  "experienceAlignmentScore": number (0-100),
  "strengthsMatched": ["string"],
  "missingSkills": ["string"],
  "whyRecommended": "string",
  "recruiterFeedback": "string",
  "skillGapAnalysis": "string",
  "interviewDifficultyPrediction": "Easy"|"Medium"|"Hard",
  "expectedSalaryFit": "Above Market"|"Market Rate"|"Below Market"|"Unknown",
  "improvementSuggestions": ["string"],
  "applyReadinessScore": number (0-100),
  "applyRecommendation": "Apply Now"|"Apply Soon"|"Upskill First"|"Not Recommended Yet",
  "applyRecommendationReason": "string",
  "interviewProbability": "High"|"Medium"|"Low",
  "estimatedLearningTime": "string or null",
  "prioritizedRoadmap": [{"skill":"string","priority":"High|Medium|Low","impact":"string"}],
  "resumeChangesForRole": ["string"],
  "interviewPrepTips": ["string"]
}`;

export async function analyzeJobMatch(candidateProfile, job) {
  const profileForMatch = { ...candidateProfile };
  delete profileForMatch.resumeText;

  const user = `
CANDIDATE PROFILE:
${JSON.stringify(profileForMatch, null, 2)}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Type: ${job.employmentType}
Salary: ${job.salaryMin || 'N/A'} - ${job.salaryMax || 'N/A'} ${job.salaryCurrency}

JOB DESCRIPTION:
${(job.description || '').slice(0, 6000)}

Evaluate match strictly against this candidate's actual skills and experience. Reference specific technologies from both resume and job description.
`.trim();

  return chatJson(MATCH_SYSTEM, user, FAST_MODEL, 0.3);
}

export async function analyzeCustomJobDescription(candidateProfile, jobDescription, jobTitle = 'Custom Role') {
  const job = {
    title: jobTitle,
    company: 'User Provided',
    location: 'N/A',
    employmentType: 'N/A',
    description: jobDescription,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'USD',
  };
  return analyzeJobMatch(candidateProfile, job);
}

export async function generateSkillGapIntelligence(candidateProfile, jobAnalyses) {
  const system = `You are a career intelligence analyst. Analyze job match data across multiple opportunities and produce a skill gap intelligence report.
Return ONLY valid JSON:
{
  "rankedSkills": [
    {"skill":"string","demandPercentage":number,"priority":number,"estimatedLearningTime":"string","difficulty":"Beginner|Intermediate|Advanced","projectedMatchIncrease":number,"resources":"string"}
  ],
  "topMatchingRoles": [{"role":"string","averageMatch":number,"count":number}],
  "marketAlignmentScore": number (0-100),
  "averageMatchScore": number,
  "categoryScores": [{"category":"string","score":number}]
}`;

  const summary = jobAnalyses.map((j) => ({
    title: j.job.title,
    company: j.job.company,
    matchScore: j.analysis.matchScore,
    missingSkills: j.analysis.missingSkills,
  }));

  const user = `
CANDIDATE SKILLS: ${candidateProfile.skills.join(', ')}
JOB MATCHES: ${JSON.stringify(summary)}
Identify which missing skills appear most frequently and rank learning priorities.
`.trim();

  return chatJson(system, user, PRIMARY_MODEL, 0.35);
}

export async function generateCareerAdvisor(candidateProfile, jobAnalyses) {
  const system = `You are a senior technical recruiter and career mentor at a FAANG company.
Return ONLY valid JSON:
{
  "bestCareerPath": "string",
  "recommendedRoles": ["string"],
  "expectedSalaryRange": "string",
  "marketReadiness": number (0-100),
  "strongestSkills": ["string"],
  "weakestAreas": ["string"],
  "fastestSalaryRoute": "string",
  "topCompaniesToTarget": ["string"],
  "recruiterComment": "string",
  "roadmap30Days": ["string"],
  "roadmap60Days": ["string"],
  "roadmap90Days": ["string"]
}`;

  const matches = jobAnalyses.slice(0, 8).map((j) => ({
    role: j.job.title,
    company: j.job.company,
    match: j.analysis.matchScore,
    recommendation: j.analysis.applyRecommendation,
  }));

  const profileForAdvisor = { ...candidateProfile };
  delete profileForAdvisor.resumeText;

  const user = `
CANDIDATE: ${JSON.stringify(profileForAdvisor, null, 2)}
TOP JOB MATCHES: ${JSON.stringify(matches)}
Provide actionable career mentorship based on real match data.
`.trim();

  return chatJson(system, user, PRIMARY_MODEL, 0.4);
}

export function buildApplyReadinessDashboard(jobAnalyses) {
  if (!jobAnalyses.length) {
    return {
      overallMarketReadiness: 0,
      strongestCategory: 'N/A',
      weakestCategory: 'N/A',
      averageRecommendationScore: 0,
      estimatedInterviewSuccessRate: 0,
      applyNowCount: 0,
      topOpportunities: [],
    };
  }

  const scores = jobAnalyses.map((j) => j.analysis.applyReadinessScore || j.analysis.matchScore);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const byCategory = {};
  jobAnalyses.forEach((j) => {
    const cat = j.job.title.split(' ').slice(-2).join(' ') || j.job.title;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(j.analysis.matchScore);
  });

  const categoryAvgs = Object.entries(byCategory).map(([cat, vals]) => ({
    category: cat,
    score: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  }));

  categoryAvgs.sort((a, b) => b.score - a.score);

  const highProb = jobAnalyses.filter((j) => j.analysis.interviewProbability === 'High').length;
  const interviewRate = Math.round((highProb / jobAnalyses.length) * 100);

  return {
    overallMarketReadiness: avg,
    strongestCategory: categoryAvgs[0]?.category || 'N/A',
    weakestCategory: categoryAvgs[categoryAvgs.length - 1]?.category || 'N/A',
    averageRecommendationScore: avg,
    estimatedInterviewSuccessRate: interviewRate,
    applyNowCount: jobAnalyses.filter((j) => j.analysis.applyRecommendation === 'Apply Now').length,
    topOpportunities: [...jobAnalyses]
      .sort((a, b) => b.analysis.matchScore - a.analysis.matchScore)
      .slice(0, 5)
      .map((j) => ({
        title: j.job.title,
        company: j.job.company,
        matchScore: j.analysis.matchScore,
        applyRecommendation: j.analysis.applyRecommendation,
        applyLink: j.job.applyLink,
      })),
  };
}

export async function parseResumeToStructuredData(resumeText) {
  const system = `You are an expert resume parser. Extract the following raw resume text into a strictly structured JSON object. Break paragraphs in the experience section into concise, actionable bullet points if they aren't already.
Return ONLY valid JSON matching this structure exactly:
{
  "personalInfo": {
    "fullName": "string", "jobTitle": "string", "location": "string", "email": "string", "phone": "string", "linkedin": "string", "portfolio": "string", "github": "string"
  },
  "summary": "string",
  "skills": ["string"],
  "experience": [
    { "company": "string", "role": "string", "startDate": "string", "endDate": "string", "bullets": ["string"] }
  ],
  "education": [
    { "school": "string", "degree": "string", "fieldOfStudy": "string", "startDate": "string", "endDate": "string" }
  ],
  "projects": [
    { "title": "string", "description": "string", "bullets": ["string"], "link": "string" }
  ]
}`;

  const user = `RESUME TEXT:\n${resumeText.slice(0, 10000)}`;
  return chatJson(system, user, PRIMARY_MODEL, 0.2);
}

export async function generateCoverLetter(profile, jobDescription, companyName, jobTitle) {
  const system = `You are an expert executive career coach writing a highly tailored, compelling cover letter.
Do not use generic placeholders like [Company Name] if the data is provided. Make it sound human, passionate, and directly tie the candidate's specific bullet points to the job description's requirements.
Return ONLY valid JSON:
{
  "coverLetter": "string (the full text of the letter, use \\n for line breaks)"
}`;

  const user = `
CANDIDATE PROFILE (Use these specific experiences and skills):
${JSON.stringify(profile, null, 2)}

TARGET JOB:
Company: ${companyName}
Title: ${jobTitle}

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

Write the cover letter. Keep it under 400 words. Highlight the exact overlaps between the profile and the JD.
`.trim();

  return chatJson(system, user, PRIMARY_MODEL, 0.6);
}

export async function generateOutreachEmail(type, context) {
  const system = `You are an expert executive career coach and technical recruiter.
Write a highly effective, professional, and concise email for the requested scenario.
Avoid generic buzzwords. Make it sound human and direct.
Return ONLY valid JSON:
{
  "subject": "string (the email subject line)",
  "body": "string (the full body of the email, use \\n for line breaks)"
}`;

  const user = `
SCENARIO: ${type}

CONTEXT DETAILS:
${JSON.stringify(context, null, 2)}

Write the email. Keep it under 200 words if possible. Ensure it includes clear placeholders like [My Name] if necessary, but use the provided context where available.
`.trim();

  return chatJson(system, user, PRIMARY_MODEL, 0.5);
}

export async function generateTailoredResumeBullets(profile, job) {
  const system = `You are an expert ATS optimization specialist and resume writer.
Given a candidate's experience and a target job description, rewrite the candidate's resume bullets to better align with the job's keywords, requirements, and terminology — while keeping them truthful and grounded in the candidate's actual experience.
Also produce a tailored professional summary (2-3 sentences) for this specific role.
Return ONLY valid JSON:
{
  "tailoredSummary": "string (2-3 sentence professional summary tailored to this role)",
  "tailoredExperience": [
    {
      "company": "string",
      "role": "string",
      "originalBullets": ["string"],
      "tailoredBullets": ["string"],
      "relevanceScore": number (0-100)
    }
  ],
  "keywordsInjected": ["string (ATS keywords woven into the bullets)"],
  "atsScoreBefore": number (0-100),
  "atsScoreAfter": number (0-100)
}`;

  const experienceData = (profile.experience || []).map(exp => ({
    company: exp.company,
    role: exp.role,
    bullets: exp.bullets || [exp.description || ''],
    startDate: exp.startDate,
    endDate: exp.endDate
  }));

  const user = `
CANDIDATE PROFILE:
Name: ${profile.name || profile.personalInfo?.fullName || 'Candidate'}
Skills: ${(profile.skills || []).join(', ')}
Experience:
${JSON.stringify(experienceData, null, 2)}

TARGET JOB:
Title: ${job.title || job.jobTitle || 'Target Role'}
Company: ${job.company || job.companyName || 'Company'}
Description:
${(job.description || job.jobDescription || '').slice(0, 5000)}

Rewrite each experience entry's bullets to maximize ATS keyword alignment with this specific job description. Keep bullets truthful. Prioritize experiences most relevant to the role.
`.trim();

  return chatJson(system, user, PRIMARY_MODEL, 0.4);
}

export async function generateNetworkingStrategy(profile, job) {
  const system = `You are a senior career strategist and networking expert.
Given a candidate's profile and a target job, generate a comprehensive networking strategy: who to reach out to, how to find them, and ready-to-send personalized messages.
Return ONLY valid JSON:
{
  "suggestedContacts": [
    { "role": "string (e.g. Engineering Manager)", "department": "string", "reason": "string (why this person)" }
  ],
  "linkedinSearchUrl": "string (a LinkedIn people search URL for this company)",
  "connectionMessage": "string (under 280 chars, personalized LinkedIn connection request)",
  "coldEmail": {
    "subject": "string",
    "body": "string (under 200 words, use \\\\n for line breaks)"
  },
  "referralRequest": {
    "subject": "string",
    "body": "string (under 200 words, for someone you already know at the company)"
  },
  "networkingTips": ["string (3-5 actionable tips specific to this company/role)"]
}`;

  const user = `
CANDIDATE:
Name: ${profile.name || profile.personalInfo?.fullName || 'Candidate'}
Current Title: ${profile.personalInfo?.jobTitle || 'Professional'}
Skills: ${(profile.skills || []).join(', ')}
Summary: ${profile.summary || ''}

TARGET JOB:
Title: ${job.title || job.jobTitle || 'Target Role'}
Company: ${job.company || job.companyName || 'Company'}
Location: ${job.location || 'Not specified'}
Description:
${(job.description || job.jobDescription || '').slice(0, 4000)}

Generate a networking strategy to get a referral or direct introduction for this specific role. Make messages personalized based on the candidate's actual background.
`.trim();

  return chatJson(system, user, PRIMARY_MODEL, 0.5);
}
