export interface RiskFactor {
  factor: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ScoreSimulation {
  modification: string;
  impactScore: number;
  explanation: string;
}

export interface ActionPlan {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
}

export interface ScoreBreakdown {
  roleFit: number;
  technicalFit: number;
  experienceFit: number;
  cultureFit: number;
  atsCompatibility: number;
}

export interface SkillContribution {
  skill: string;
  contribution: number;
}

export interface ProbabilityDistribution {
  shortlist: number;
  interview: number;
  offer: number;
}

export interface SuccessPredictionData {
  applicationSuccessScore: number;
  interviewProbability: number;
  shortlistProbability: number;
  offerProbability: number;
  recruiterInterestLevel: string;
  applicationRecommendation: 'Apply Now' | 'Apply Soon' | 'Upskill First' | 'Not Recommended Yet';
  confidenceLevel: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  riskFactors: RiskFactor[];
  resumeAdvantages: string[];
  resumeDisadvantages: string[];
  atsCompatibility: number;
  roleFitScore: number;
  technicalFitScore: number;
  experienceFitScore: number;
  cultureFitScore: number;
  salaryFitScore: number;
  competitionLevel: string;
  estimatedApplicantRanking: string;
  recruiterFeedback: string;
  hiringManagerFeedback: string;
  interviewPreparationTips: string[];
  resumeImprovementSuggestions: string[];
  applicationStrategy: string;
  personalizedNextSteps: string[];
  whyThisScore: string;
  scoreSimulations: ScoreSimulation[];
  actionPlan: ActionPlan;
  scoreBreakdown: ScoreBreakdown;
  skillContributionAnalysis: SkillContribution[];
  probabilityDistribution: ProbabilityDistribution;
}

export interface SuccessPredictionRecord {
  _id: string;
  userEmail: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location?: string;
  prediction: SuccessPredictionData;
  createdAt: string;
  updatedAt: string;
}
