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

import axiosInstance from './axiosInstance';

const API = '/api/roadmap';

export const roadmapApi = {
  getRoadmap: (email: string) =>
    axiosInstance.get<CareerRoadmap>(`${API}/${encodeURIComponent(email)}`).then(res => res.data),

  generateRoadmap: (email: string, targetRole: string) =>
    axiosInstance.post<CareerRoadmap>(`${API}/${encodeURIComponent(email)}/generate`, { targetRole }).then(res => res.data),

  completeTask: (email: string, taskId: string) =>
    axiosInstance.post<CareerRoadmap>(`${API}/${encodeURIComponent(email)}/complete-task`, { taskId }).then(res => res.data),

  uncompleteTask: (email: string, taskId: string) =>
    axiosInstance.post<CareerRoadmap>(`${API}/${encodeURIComponent(email)}/uncomplete-task`, { taskId }).then(res => res.data),

  askMentor: (email: string, question: string) =>
    axiosInstance.post<{ answer: string }>(`${API}/${encodeURIComponent(email)}/mentor-ask`, { question }).then(res => res.data),
};
