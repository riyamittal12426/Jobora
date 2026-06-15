import { chatJson, PRIMARY_MODEL } from './jobGroqService.js';
import { searchAndCategorizeResources } from './resourceSearchService.js';
import CareerRoadmap from '../models/CareerRoadmap.js';

export async function generatePersonalizedRoadmap(resumeData, targetRole, sessionData = null) {
  const userEmail = resumeData.userEmail;

  // Extract candidate profile details
  const currentSkills = resumeData.foundSkills || [];
  const missingSkills = resumeData.missingSkills || [];
  const experienceLevel = resumeData.experienceLevel || 'Mid';

  // Gather market context if a job recommendations session exists
  let marketContext = '';
  if (sessionData && sessionData.skillGapIntelligence) {
    marketContext = `
Market Alignment Score: ${sessionData.skillGapIntelligence.marketAlignmentScore || 0}%
Market Average Match Score: ${sessionData.skillGapIntelligence.averageMatchScore || 0}%
Skills demand: ${JSON.stringify(sessionData.skillGapIntelligence.rankedSkills || [])}
    `;
  }

  const systemPrompt = `You are an expert Career Coach, Technical Mentor, Recruiter, and Industry Advisor.
Analyze the candidate's resume details, current skills, experience level, missing skills, target role, and market demand context.
Generate a structured, highly personalized career growth roadmap that bridges the gap from their current skills to the target role.

Important:
- Return ONLY valid JSON matching this exact structure:
{
  "currentSkillAssessment": {
    "summary": "Detailed, professional analysis of candidate's current capabilities, key highlights, and suitability for the target role.",
    "level": "Junior|Mid|Senior",
    "skills": ["skill1", "skill2"]
  },
  "missingSkills": [
    {
      "skill": "skill name",
      "employabilityImpact": 85, // 0-100 percentage based on market priority
      "matchScoreImpact": 12 // estimated percentage points improvement on Match Score
    }
  ],
  "highPrioritySkills": ["skill1", "skill2"],
  "plans": {
    "immediate": {
      "title": "Immediate Actions (7 Days)",
      "tasks": [
        {
          "id": "imm_1",
          "title": "Task title (e.g. Set up Kubernetes local cluster)",
          "description": "Step-by-step description of what to do",
          "skill": "associated skill name",
          "estimatedTime": "5 hours",
          "difficulty": "Beginner",
          "learningObjectives": ["objective 1", "objective 2"],
          "matchScoreImprovement": 4, // 1-10 expected percentage points match score increase
          "interviewReadinessImprovement": 3, // 1-10 expected points increase
          "salaryImpact": "$2,000" // Estimated yearly salary market impact
        }
      ]
    },
    "shortTerm": {
      "title": "Short-Term Goals (30 Days)",
      "tasks": [
        {
          "id": "st_1",
          "title": "...",
          "description": "...",
          "skill": "...",
          "estimatedTime": "...",
          "difficulty": "...",
          "learningObjectives": [...],
          "matchScoreImprovement": 0,
          "interviewReadinessImprovement": 0,
          "salaryImpact": "..."
        }
      ]
    },
    "midTerm": {
      "title": "Mid-Term Goals (60 Days)",
      "tasks": [
        {
          "id": "mt_1",
          "title": "...",
          "description": "...",
          "skill": "...",
          "estimatedTime": "...",
          "difficulty": "...",
          "learningObjectives": [...],
          "matchScoreImprovement": 0,
          "interviewReadinessImprovement": 0,
          "salaryImpact": "..."
        }
      ]
    },
    "longTerm": {
      "title": "Long-Term Goals (90+ Days)",
      "tasks": [
        {
          "id": "lt_1",
          "title": "...",
          "description": "...",
          "skill": "...",
          "estimatedTime": "...",
          "difficulty": "...",
          "learningObjectives": [...],
          "matchScoreImprovement": 0,
          "interviewReadinessImprovement": 0,
          "salaryImpact": "..."
        }
      ]
    }
  },
  "recommendedProjects": [
    {
      "title": "Project Title",
      "description": "Detailed portfolio project description that candidate should build to showcase this skill.",
      "skillsCovered": ["skill1", "skill2"],
      "githubIdea": "Structure guidelines or folder organization for their Github repository."
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "provider": "AWS / Microsoft / CNCF / etc.",
      "difficulty": "Beginner|Intermediate|Advanced"
    }
  ],
  "interviewPreparationPlan": {
    "weeklyGoals": ["goal 1", "goal 2"],
    "monthlyGoals": ["goal 1", "goal 2"],
    "resumeImprovementSuggestions": ["suggestion 1", "suggestion 2"],
    "interviewPrepPlan": ["prep step 1", "prep step 2"]
  },
  "expectedMatchScoreImprovement": 22, // total estimated score increase after completing roadmap (e.g. 15-30)
  "expectedCareerGrowth": "Description of long term career growth, promotions, or leadership paths.",
  "salaryGrowthPotential": "$100,000 - $125,000",
  "aiImpactSimulation": {
    "currentMetrics": {
      "matchScore": 72, // start score (0-100)
      "interviewProbability": 40, // percentage (0-100)
      "offerProbability": 20, // percentage (0-100)
      "applicationSuccessScore": 45 // percentage (0-100)
    },
    "impacts": [
      {
        "skill": "skill/cert name",
        "newMatchScore": 85,
        "newInterviewProbability": 65,
        "newOfferProbability": 45,
        "newApplicationSuccessScore": 70
      }
    ]
  },
  "careerProjection": {
    "possibleJobRoles": ["Role A", "Role B"],
    "salaryRanges": ["$90k - $120k"],
    "careerOpportunities": "Details on market growth and target opportunities."
  },
  "aiMentorSummary": "An inspirational message from your Groq Career Coach summarizing this roadmap's focus."
}
`;

  const userPrompt = `
TARGET ROLE: ${targetRole}
CANDIDATE DETAILS:
Current Skills: ${currentSkills.join(', ')}
Missing Skills Identified: ${missingSkills.join(', ')}
Resume Experience Level: ${experienceLevel}
Resume Text Excerpt: ${(resumeData.resumeText || '').slice(0, 5000)}

JOB RECOMMENDATION SESSION / MARKET DATA:
${marketContext}

Generate a detailed, custom roadmap. Ensure all plan stages (immediate, shortTerm, midTerm, longTerm) have at least 2-3 specific, non-trivial, step-by-step tasks related to acquiring missing skills or optimizing their profile for "${targetRole}". 
The simulation section should include a baseline current metrics (e.g., matching the user's current overallScore or standard baseline ~65-75%) and progress increments for at least 3-4 major skills/certifications from their missing skills list.
`;

  console.log(`[Groq Roadmap] Triggering Groq Career Roadmap Generation for "${targetRole}"...`);
  const rawRoadmap = await chatJson(systemPrompt, userPrompt, PRIMARY_MODEL, 0.45);

  // Default Milestones to initialize
  const milestones = [
    { name: "Ascent Initiated", targetPercentage: 25, unlocked: false },
    { name: "Competency Unlocked", targetPercentage: 50, unlocked: false },
    { name: "Elite Practitioner", targetPercentage: 75, unlocked: false },
    { name: "Dream-Role Mastered", targetPercentage: 100, unlocked: false }
  ];

  // 3. Resolve learning resources for all tasks and missing skills
  // Let's identify all skills that need resources
  const skillsToFetch = new Set();
  
  // Collect from missing skills
  if (rawRoadmap.missingSkills) {
    rawRoadmap.missingSkills.forEach(item => {
      if (item.skill) skillsToFetch.add(item.skill.trim());
    });
  }

  // Collect from plan tasks
  const phases = ['immediate', 'shortTerm', 'midTerm', 'longTerm'];
  phases.forEach(phase => {
    if (rawRoadmap.plans?.[phase]?.tasks) {
      rawRoadmap.plans[phase].tasks.forEach(task => {
        if (task.skill) {
          skillsToFetch.add(task.skill.trim());
        }
      });
    }
  });

  const skillsList = Array.from(skillsToFetch);
  console.log(`[Resource Engine] Resolving resources for ${skillsList.length} skills in parallel...`);

  // Fetch all in parallel
  const resourceMap = {};
  await Promise.all(
    skillsList.map(async (skill) => {
      try {
        const resources = await searchAndCategorizeResources(skill);
        resourceMap[skill.toLowerCase()] = resources;
      } catch (err) {
        console.error(`Failed resolving resources for skill "${skill}":`, err);
      }
    })
  );

  // Bind resources back to tasks
  phases.forEach(phase => {
    if (rawRoadmap.plans?.[phase]?.tasks) {
      rawRoadmap.plans[phase].tasks.forEach(task => {
        const key = (task.skill || '').trim().toLowerCase();
        task.resources = resourceMap[key] || getEmptyResources();
      });
    }
  });

  // Assemble full roadmap model
  const roadmapData = {
    userEmail,
    targetRole,
    experienceLevel: rawRoadmap.currentSkillAssessment?.level || experienceLevel,
    currentSkills: rawRoadmap.currentSkillAssessment?.skills || currentSkills,
    missingSkills: (rawRoadmap.missingSkills || []).map(m => m.skill),
    highPrioritySkills: rawRoadmap.highPrioritySkills || [],
    milestones,
    plans: rawRoadmap.plans,
    recommendedProjects: rawRoadmap.recommendedProjects,
    certifications: rawRoadmap.certifications,
    interviewPreparationPlan: rawRoadmap.interviewPreparationPlan,
    expectedMatchScoreImprovement: rawRoadmap.expectedMatchScoreImprovement,
    expectedCareerGrowth: rawRoadmap.expectedCareerGrowth,
    salaryGrowthPotential: rawRoadmap.salaryGrowthPotential,
    aiImpactSimulation: rawRoadmap.aiImpactSimulation,
    careerProjection: rawRoadmap.careerProjection,
    aiMentorSummary: rawRoadmap.aiMentorSummary,
    completedTasks: [],
    currentProgress: 0
  };

  // Upsert into MongoDB
  console.log(`[Mongo Save] Saving generated career roadmap for user "${userEmail}"...`);
  const savedRoadmap = await CareerRoadmap.findOneAndUpdate(
    { userEmail },
    { $set: roadmapData },
    { upsert: true, new: true }
  );

  return savedRoadmap;
}

function getEmptyResources() {
  return {
    officialDocumentation: [],
    freeCourses: [],
    youtubeTutorials: [],
    practiceLabs: [],
    projects: [],
    certifications: [],
    interviewPrep: []
  };
}
