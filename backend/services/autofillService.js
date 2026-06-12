import { chatJson } from './jobGroqService.js';

const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FAST_MODEL = 'llama-3.1-8b-instant';

const EXTRACT_PROFILE_SYSTEM = `You are a professional resume parsing engine.
Extract candidate details from the provided resume text into a structured, valid JSON object.
Rules:
- If a detail is missing, set it to an empty string, null, or empty array.
- For education/experience dates, extract them as strings (e.g. "2021-09" or "Present" or "June 2024").
- Do not create mock or placeholder information.
Return ONLY valid JSON:
{
  "name": "Full Name",
  "email": "Email Address",
  "phone": "Phone Number",
  "linkedinUrl": "LinkedIn profile link or null",
  "githubUrl": "GitHub link or null",
  "portfolioUrl": "Portfolio website link or null",
  "skills": ["skill1", "skill2"],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree (e.g. BS, MS)",
      "fieldOfStudy": "Major/Field of study",
      "startDate": "Start date",
      "endDate": "End date or Present"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "description": "Short bullet points of achievements/responsibilities",
      "startDate": "Start date",
      "endDate": "End date or Present"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Short description of project",
      "link": "Project link or null"
    }
  ],
  "certifications": ["Cert1", "Cert2"],
  "achievements": ["Achievement1", "Achievement2"]
}`;

const GENERATE_ANSWERS_SYSTEM = `You are an AI job application assistant.
Based on the candidate's profile and the job description, generate professional, customized, role-specific answers for common application screening questions.
Generate answers for the following questions:
1. "Tell us about yourself" (Brief, engaging elevator pitch)
2. "Why should we hire you?" (Connect candidate's top strengths and skills with the job description requirements)
3. "Describe a project relevant to this role" (Detail a project from their resume that fits the job description, explaining what they did, technologies used, and outcomes)
4. "Describe your experience with the primary technology required for this role" (Identify the core tool/tech in the job description, e.g. AWS, React, Python, and write an overview of their experience with it)
5. "What are your career goals?" (Short-term and long-term career aspirations aligned with this position)
6. "Expected salary" (Suggest a professional answer requesting market rate or specific range if mentioned, or deferring to interview)
7. "Notice period" (Default to a standard notice period like "Immediate" or "2-4 weeks" based on standard profile facts or general defaults)

For each question, return:
- "question": The question text
- "answer": The generated answer (1-3 concise paragraphs, professional, matches candidate's achievements)
- "confidenceScore": An integer (0-100) representing how well the candidate's resume supports this answer
- "explanation": A brief note explaining which part of the resume was used (e.g., "Generated based on your Project X where you used React and Node.js.")
- "fieldKey": A string identifier for mapping (e.g., "about_self", "why_hire", "relevant_project", "tech_experience", "career_goals", "expected_salary", "notice_period")

Return ONLY valid JSON in this structure:
{
  "answers": [
    {
      "question": "string",
      "answer": "string",
      "confidenceScore": number,
      "explanation": "string",
      "fieldKey": "string"
    }
  ]
}`;

const COVER_LETTER_SYSTEM = `You are an expert executive resume writer.
Write a professional, highly tailored, and compelling Cover Letter for the candidate applying to the job description provided.
The letter should:
- Address the hiring manager/recruiter.
- Incorporate key achievements from the candidate's experience and projects.
- Express enthusiasm for the specific company and role.
- Be concise (approx. 250-350 words).
Return a JSON object:
{
  "coverLetter": "The full text of the cover letter with proper spacing and line breaks (use \\n for line breaks)"
}`;

const RECRUITER_REVIEW_SYSTEM = `You are a critical, elite FAANG technical recruiter.
Evaluate this completed job application package (candidate profile, screening answers, cover letter) against the job description.
Return a realistic assessment of how a recruiter will react. Be honest and rigorous.
Return ONLY valid JSON:
{
  "predictedReaction": "A summary of how the recruiter will likely view the application (e.g., key highlights they'll notice first, and areas where they might hesitate).",
  "interviewProbability": "High"|"Medium"|"Low",
  "matchScore": number (0-100),
  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "potentialRedFlags": ["Red flag or skill gap 1", "Any potential issue, like short tenure, missing key stack tech, etc."]
}`;

export async function parseProfileFromResume(resumeText) {
  const userPrompt = `RESUME TEXT:\n${resumeText.slice(0, 15000)}`;
  return chatJson(EXTRACT_PROFILE_SYSTEM, userPrompt, PRIMARY_MODEL, 0.2);
}

export async function generateAutofillAnswers(candidateProfile, jobInfo) {
  // Exclude raw resume text from profile to keep prompt light
  const profileSnapshot = { ...candidateProfile };
  delete profileSnapshot.resumeText;

  const userPrompt = `
CANDIDATE PROFILE:
${JSON.stringify(profileSnapshot, null, 2)}

JOB DETAILS:
Title: ${jobInfo.title}
Company: ${jobInfo.company}
Location: ${jobInfo.location || 'N/A'}
Description: ${(jobInfo.description || '').slice(0, 5000)}
  `.trim();

  return chatJson(GENERATE_ANSWERS_SYSTEM, userPrompt, FAST_MODEL, 0.35);
}

export async function generateCoverLetter(candidateProfile, jobInfo) {
  const profileSnapshot = { ...candidateProfile };
  delete profileSnapshot.resumeText;

  const userPrompt = `
CANDIDATE PROFILE:
${JSON.stringify(profileSnapshot, null, 2)}

JOB DETAILS:
Title: ${jobInfo.title}
Company: ${jobInfo.company}
Description: ${(jobInfo.description || '').slice(0, 5000)}
  `.trim();

  return chatJson(COVER_LETTER_SYSTEM, userPrompt, PRIMARY_MODEL, 0.4);
}

export async function generateRecruiterReview(candidateProfile, jobInfo, answers, coverLetter) {
  const profileSnapshot = { ...candidateProfile };
  delete profileSnapshot.resumeText;

  const userPrompt = `
CANDIDATE PROFILE:
${JSON.stringify(profileSnapshot, null, 2)}

JOB DETAILS:
Title: ${jobInfo.title}
Company: ${jobInfo.company}
Description: ${(jobInfo.description || '').slice(0, 5000)}

SCREENING ANSWERS:
${JSON.stringify(answers, null, 2)}

COVER LETTER:
${coverLetter}
  `.trim();

  return chatJson(RECRUITER_REVIEW_SYSTEM, userPrompt, PRIMARY_MODEL, 0.3);
}
