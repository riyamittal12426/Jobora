export interface ResourceLink {
  title: string;
  url: string;
  snippet?: string;
}

export interface LearningResources {
  officialDocumentation: ResourceLink[];
  freeCourses: ResourceLink[];
  youtubeTutorials: ResourceLink[];
  practiceLabs: ResourceLink[];
  projects: ResourceLink[];
  certifications: ResourceLink[];
  interviewPrep: ResourceLink[];
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  skill?: string;
  estimatedTime?: string;
  difficulty?: string;
  learningObjectives?: string[];
  matchScoreImprovement?: number;
  interviewReadinessImprovement?: number;
  salaryImpact?: string;
  resources?: LearningResources;
}

export interface RoadmapPhase {
  title: string;
  tasks: RoadmapTask[];
}

export interface Milestone {
  name: string;
  targetPercentage: number;
  unlocked: boolean;
  earnedAt?: string;
}

export interface CareerRoadmap {
  _id: string;
  userEmail: string;
  targetRole: string;
  experienceLevel?: string;
  currentSkills?: string[];
  missingSkills?: string[];
  highPrioritySkills?: string[];
  milestones?: Milestone[];
  plans?: {
    immediate: RoadmapPhase;
    shortTerm: RoadmapPhase;
    midTerm: RoadmapPhase;
    longTerm: RoadmapPhase;
  };
  recommendedProjects?: {
    title: string;
    description: string;
    skillsCovered: string[];
    githubIdea?: string;
  }[];
  certifications?: {
    name: string;
    provider: string;
    difficulty: string;
  }[];
  interviewPreparationPlan?: {
    weeklyGoals: string[];
    monthlyGoals: string[];
    resumeImprovementSuggestions: string[];
    interviewPrepPlan: string[];
  };
  expectedMatchScoreImprovement?: number;
  expectedCareerGrowth?: string;
  salaryGrowthPotential?: string;
  aiImpactSimulation?: {
    currentMetrics: {
      matchScore: number;
      interviewProbability: number;
      offerProbability: number;
      applicationSuccessScore: number;
    };
    impacts: {
      skill: string;
      newMatchScore: number;
      newInterviewProbability: number;
      newOfferProbability: number;
      newApplicationSuccessScore: number;
    }[];
  };
  careerProjection?: {
    possibleJobRoles: string[];
    salaryRanges: string[];
    careerOpportunities?: string;
  };
  aiMentorSummary?: string;
  completedTasks: string[];
  currentProgress: number;
  createdAt: string;
  updatedAt: string;
}

import { API_BASE_URL } from './apiConfig';

const API = `${API_BASE_URL}/api/roadmap`;

const getHeaders = (hasBody = true) => {
  const token = localStorage.getItem('token');
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const roadmapApi = {
  getRoadmap: (email: string) =>
    fetch(`${API}/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then((r) => handle<CareerRoadmap>(r)),

  generateRoadmap: (email: string, targetRole: string) =>
    fetch(`${API}/${encodeURIComponent(email)}/generate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ targetRole }),
    }).then((r) => handle<CareerRoadmap>(r)),

  completeTask: (email: string, taskId: string) =>
    fetch(`${API}/${encodeURIComponent(email)}/complete-task`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ taskId }),
    }).then((r) => handle<CareerRoadmap>(r)),

  uncompleteTask: (email: string, taskId: string) =>
    fetch(`${API}/${encodeURIComponent(email)}/uncomplete-task`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ taskId }),
    }).then((r) => handle<CareerRoadmap>(r)),

  askMentor: (email: string, question: string) =>
    fetch(`${API}/${encodeURIComponent(email)}/mentor-ask`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ question }),
    }).then((r) => handle<{ answer: string }>(r)),
};
