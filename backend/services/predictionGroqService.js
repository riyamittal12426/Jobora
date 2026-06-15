import { chatJson, PRIMARY_MODEL } from './jobGroqService.js';

const SYSTEM_PROMPT = `You are a Senior Technical Recruiter, Hiring Manager, ATS Expert, and Career Coach.
Analyze the candidate profile and job description.
Predict their success probabilities, strengths, risk factors, competitive analysis, simulations, and customized action plan.

Be realistic, critical, and conservative. Do not artificially inflate scores. A typical candidate should get average scores. If they are missing key skills, reduce scores accordingly.

Return ONLY a valid JSON object matching the following structure exactly (no other text, no markdown comments, just valid JSON):
{
  "applicationSuccessScore": 72,
  "interviewProbability": 65,
  "shortlistProbability": 80,
  "offerProbability": 40,
  "recruiterInterestLevel": "Medium",
  "applicationRecommendation": "Apply Soon",
  "confidenceLevel": "High",
  "strengths": ["Strong Node.js background", "Quantitative performance metrics listed"],
  "weaknesses": ["Lacks cloud infrastructure experience", "Missing domain specific knowledge"],
  "missingSkills": ["AWS", "Docker"],
  "riskFactors": [
    { "factor": "No cloud experience", "severity": "Medium", "description": "Job requires AWS but candidate profile doesn't mention AWS." }
  ],
  "resumeAdvantages": ["Clear structure", "Highly readable"],
  "resumeDisadvantages": ["No cloud architecture keywords"],
  "atsCompatibility": 85,
  "roleFitScore": 75,
  "technicalFitScore": 70,
  "experienceFitScore": 75,
  "cultureFitScore": 80,
  "salaryFitScore": 90,
  "competitionLevel": "High",
  "estimatedApplicantRanking": "Top 25%",
  "recruiterFeedback": "The candidate has solid core skills, but we need someone who can deploy applications on cloud platforms from day one.",
  "hiringManagerFeedback": "Good project history. Let's see if we can do an initial technical screening focusing on their architecture and backend skills.",
  "interviewPreparationTips": [
    "Prepare to talk about scaling systems with Node.js",
    "Brush up on relational database design queries"
  ],
  "resumeImprovementSuggestions": [
    "Explicitly add Docker and Container deployment experience",
    "Include key certifications on AWS or general cloud services"
  ],
  "applicationStrategy": "Apply early and highlight Node.js optimization projects in the initial recruiter chat.",
  "personalizedNextSteps": [
    "Take a 1-day course on AWS essentials",
    "Deploy a demo project to a container service and document it"
  ],
  "whyThisScore": "Calculated based on candidate's strong backend alignment offset by lack of cloud skills required for this deployment-heavy role.",
  "scoreSimulations": [
    { "modification": "Learn AWS Cloud Essentials", "impactScore": 82, "explanation": "Addresses the primary technical skill gap, showing cloud competence." },
    { "modification": "Obtain AWS Solutions Architect Cert", "impactScore": 88, "explanation": "Validates cloud capability, raising technical and resume scores." },
    { "modification": "Add Docker to Resume Projects", "impactScore": 79, "explanation": "Eliminates risk of automated filter rejection due to container keywords." },
    { "modification": "Include 2+ more Quantifiable Metrics", "impactScore": 75, "explanation": "Improves ATS score and recruiters' impression of accomplishments." }
  ],
  "actionPlan": {
    "immediate": ["Review Node.js performance tuning topics", "Add missing SQL index examples to GitHub"],
    "shortTerm": ["Complete a cloud architecture tutorial", "Earn a foundational cloud certification"],
    "longTerm": ["Contribute to an open-source container deployment tool"]
  },
  "scoreBreakdown": {
    "roleFit": 75,
    "technicalFit": 70,
    "experienceFit": 75,
    "cultureFit": 80,
    "atsCompatibility": 85
  },
  "skillContributionAnalysis": [
    { "skill": "Node.js", "contribution": 35 },
    { "skill": "React", "contribution": 20 },
    { "skill": "MongoDB", "contribution": 15 }
  ],
  "probabilityDistribution": {
    "shortlist": 80,
    "interview": 65,
    "offer": 40
  }
}`;

/**
 * Run the Groq model to predict candidate success.
 */
export async function generateSuccessPrediction(candidateProfile, resumeData, job) {
  const userPrompt = `
CANDIDATE INFORMATION:
- Skills: ${JSON.stringify(candidateProfile.skills)}
- Experience Level: ${candidateProfile.experienceLevel}
- Strengths: ${JSON.stringify(resumeData.strengths || [])}
- Weaknesses: ${JSON.stringify(resumeData.weaknesses || [])}
- Missing Skills: ${JSON.stringify(resumeData.missingSkills || [])}
- Resume ATS Score: ${resumeData.overallScore || 70}
- Technical Score: ${resumeData.technicalScore || 70}
- Experience Score: ${resumeData.experienceScore || 70}
- Resume Word Count: ${resumeData.wordCount || 0}
- Metrics Count: ${resumeData.metricsCount || 0}

JOB INFORMATION:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Remote/Not Specified'}
- Employment Type: ${job.employmentType || 'Full-time'}
- Salary Details: Min ${job.salaryMin || 'N/A'}, Max ${job.salaryMax || 'N/A'} ${job.salaryCurrency || 'USD'}
- Description:
${(job.description || '').slice(0, 8000)}

Please analyze their alignment in detail, simulate recruitment screenings, list improvements, and simulate candidate scores. Return the exact JSON schema requested.
`;

  // Re-use jobGroqService's rate limit handling and fast model fallback
  return chatJson(SYSTEM_PROMPT, userPrompt, PRIMARY_MODEL, 0.4);
}

/**
 * Handle custom simulate predictions
 */
export async function simulateSuccessPrediction(candidateProfile, resumeData, job, modifications) {
  // Apply modifications dynamically to profile
  const modifiedProfile = { ...candidateProfile };
  const modifiedResumeData = { ...resumeData };

  modifications.forEach(mod => {
    if (mod.type === 'addSkill') {
      if (!modifiedProfile.skills.includes(mod.value)) {
        modifiedProfile.skills = [...modifiedProfile.skills, mod.value];
      }
    } else if (mod.type === 'improveAts') {
      modifiedResumeData.overallScore = Math.min(100, (modifiedResumeData.overallScore || 70) + Number(mod.value));
    } else if (mod.type === 'addCert') {
      // Simulating certificate addition by adding to strengths and technical scores
      modifiedResumeData.technicalScore = Math.min(100, (modifiedResumeData.technicalScore || 70) + Number(mod.value));
    } else if (mod.type === 'addProject') {
      modifiedResumeData.experienceScore = Math.min(100, (modifiedResumeData.experienceScore || 70) + Number(mod.value));
    }
  });

  return generateSuccessPrediction(modifiedProfile, modifiedResumeData, job);
}
