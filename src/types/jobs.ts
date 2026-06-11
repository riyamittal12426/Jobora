export type HiringProbability = 'High' | 'Medium' | 'Low';
export type ApplyRecommendation = 'Apply Now' | 'Apply Soon' | 'Upskill First' | 'Not Recommended Yet';
export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface JobListing {
  jobId: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
  applyLink: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  postedAt?: string | null;
  isRemote?: boolean;
  searchQuery?: string;
}

export interface JobMatchAnalysis {
  matchScore: number;
  hiringProbability: HiringProbability;
  roleFitScore: number;
  skillAlignmentScore: number;
  experienceAlignmentScore: number;
  strengthsMatched: string[];
  missingSkills: string[];
  whyRecommended: string;
  recruiterFeedback: string;
  skillGapAnalysis: string;
  interviewDifficultyPrediction: InterviewDifficulty;
  expectedSalaryFit: string;
  improvementSuggestions: string[];
  applyReadinessScore: number;
  applyRecommendation: ApplyRecommendation;
  applyRecommendationReason: string;
  interviewProbability: HiringProbability;
  estimatedLearningTime?: string | null;
  prioritizedRoadmap?: { skill: string; priority: string; impact: string }[];
  resumeChangesForRole?: string[];
  interviewPrepTips?: string[];
}

export interface RankedSkill {
  skill: string;
  demandPercentage: number;
  priority: number;
  estimatedLearningTime: string;
  difficulty: string;
  projectedMatchIncrease: number;
  resources: string;
}

export interface SkillGapIntelligence {
  rankedSkills: RankedSkill[];
  topMatchingRoles: { role: string; averageMatch: number; count: number }[];
  marketAlignmentScore: number;
  averageMatchScore: number;
  categoryScores: { category: string; score: number }[];
}

export interface CareerAdvisor {
  bestCareerPath: string;
  recommendedRoles: string[];
  expectedSalaryRange: string;
  marketReadiness: number;
  strongestSkills: string[];
  weakestAreas: string[];
  fastestSalaryRoute: string;
  topCompaniesToTarget: string[];
  recruiterComment: string;
  roadmap30Days: string[];
  roadmap60Days: string[];
  roadmap90Days: string[];
}

export interface ApplyReadinessDashboard {
  overallMarketReadiness: number;
  strongestCategory: string;
  weakestCategory: string;
  averageRecommendationScore: number;
  estimatedInterviewSuccessRate: number;
  applyNowCount: number;
  topOpportunities: {
    title: string;
    company: string;
    matchScore: number;
    applyRecommendation: ApplyRecommendation;
    applyLink: string;
  }[];
}

export interface JobAnalytics {
  topMatchingRoles: { role: string; averageMatch: number; count: number }[];
  skillDemandHeatmap: { skill: string; demand: number }[];
  marketAlignmentScore: number;
  averageMatchScore: number;
  categoryScores: { category: string; score: number }[];
}

export interface JobWithAnalysis {
  job: JobListing;
  analysis: JobMatchAnalysis;
}

export interface JobRecommendationSession {
  _id: string;
  userEmail: string;
  candidateProfile: Record<string, unknown>;
  jobs: JobWithAnalysis[];
  skillGapIntelligence: SkillGapIntelligence;
  careerAdvisor: CareerAdvisor;
  applyReadinessDashboard: ApplyReadinessDashboard;
  analytics: JobAnalytics;
  createdAt: string;
}

export interface SavedJobRecord {
  _id: string;
  userEmail: string;
  jobId: string;
  job: JobListing;
  analysis: JobMatchAnalysis;
  createdAt: string;
}

export function getMatchBadgeVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
}
