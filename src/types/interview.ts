export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard';
export type InterviewType = 'Technical' | 'HR' | 'Project-Based' | 'Scenario-Based' | 'Mixed';
export type ReadinessLevel = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';

export interface InterviewSettings {
  questionCount: number;
  difficulty: InterviewDifficulty;
  interviewType: InterviewType;
  targetRole: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  category: string;
  focusArea?: string;
  resumeReference?: string;
}

export interface AnswerEvaluation {
  technicalAccuracy: number;
  communicationSkills: number;
  problemSolving: number;
  depthOfKnowledge: number;
  confidenceLevel: number;
  relevance: number;
  internalNotes?: string;
}

export interface LearningRoadmapItem {
  topic: string;
  priority: 'High' | 'Medium' | 'Low';
  resources: string;
  timeline: string;
}

export interface QuestionBreakdownItem {
  questionIndex: number;
  question: string;
  answer: string;
  overallQuestionScore: number;
  scores: AnswerEvaluation;
  whatWasGood: string;
  whatWasMissing: string;
  idealAnswerExample: string;
}

export interface FinalInterviewReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  resumeAlignmentScore: number;
  interviewReadinessLevel: ReadinessLevel;
  readinessPercentage: number;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  missingSkills: string[];
  roleFitAnalysis: string;
  recruiterFeedback: string;
  learningRoadmap: LearningRoadmapItem[];
  aiFeedbackSummary: string;
  questionBreakdown: QuestionBreakdownItem[];
}

export interface ResumeAnalysisData {
  userEmail: string;
  foundSkills: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  experienceLevel: string;
  resumeSummary?: string;
  overallScore?: number;
}

export interface InterviewSessionStart {
  interviewId: string;
  totalQuestions: number;
  currentIndex: number;
  question: InterviewQuestion;
}

export interface InterviewAnswerResponse {
  completed: boolean;
  interviewId?: string;
  currentIndex?: number;
  totalQuestions?: number;
  question?: InterviewQuestion;
  finalReport?: FinalInterviewReport;
}

export interface InterviewHistoryItem {
  _id: string;
  settings: InterviewSettings;
  status: string;
  finalReport?: FinalInterviewReport;
  createdAt: string;
}

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export const TARGET_ROLES = [
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'Mobile Developer',
  'Site Reliability Engineer',
] as const;

export const DIFFICULTY_OPTIONS: InterviewDifficulty[] = ['Easy', 'Medium', 'Hard'];

export const INTERVIEW_TYPES: InterviewType[] = [
  'Technical',
  'HR',
  'Project-Based',
  'Scenario-Based',
  'Mixed',
];
