export type AutomationStatus =
  | 'PENDING'
  | 'STARTING'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'PARTIALLY_COMPLETED'
  | 'queued';

export type JobAutomationStatus =
  | 'PENDING'
  | 'STARTING'
  | 'OPENING_APPLICATION'
  | 'DETECTING_FIELDS'
  | 'MAPPING_FIELDS'
  | 'UPLOADING_RESUME'
  | 'GENERATING_ANSWERS'
  | 'FILLING_FORM'
  | 'CAPTCHA_REQUIRED'
  | 'USER_VERIFIED'
  | 'REVIEW_REQUIRED'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'FAILED'
  | 'skipped'
  | 'queued'
  | 'detecting'
  | 'filling'
  | 'uploading'
  | 'generating_answers'
  | 'awaiting_approval'
  | 'approved'
  | 'captcha_detected';

export interface AutomationLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface DetectedField {
  selector?: string;
  id?: string;
  name?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  required: boolean;
  mappedKey?: string;
  mappedValue?: string;
  confidence: number;
}

export interface GeneratedAnswer {
  question: string;
  answer: string;
  confidenceScore: number;
  explanation?: string;
  cached: boolean;
}

export interface ScreenshotData {
  preSubmission?: string;
  postSubmission?: string;
  error?: string;
}

export interface ErrorDetails {
  type?: string;
  message?: string;
  recoverable: boolean;
}

export interface SubmissionResult {
  success?: boolean;
  timestamp?: string;
  confirmationUrl?: string;
}

export interface JobAutomationEntry {
  _id?: string;
  jobId: string;
  jobInfo: {
    title: string;
    company: string;
    location?: string;
    employmentType?: string;
    description?: string;
    applyLink?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
  };
  preparedApplicationId?: string;
  status: JobAutomationStatus;
  platform: 'greenhouse' | 'lever' | 'wellfound' | 'ycjobs' | 'generic';
  detectedFields: DetectedField[];
  generatedAnswers: GeneratedAnswer[];
  screenshots: ScreenshotData;
  videoPath?: string;
  captchaCheckedAt?: string;
  automationLog: AutomationLog[];
  errorDetails?: ErrorDetails;
  submissionResult?: SubmissionResult;
  matchScore: number;
  applyReadinessScore: number;
  startedAt?: string;
  completedAt?: string;
}

export interface AutomationRun {
  _id: string;
  userEmail: string;
  status: AutomationStatus;
  jobs: JobAutomationEntry[];
  progress: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    currentIndex: number;
  };
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIPrediction {
  interviewProbability: number;
  shortlistingProbability: number;
  resumeStrengthAnalysis?: string;
  strongestSellingPoints: string[];
  biggestWeaknesses: string[];
  suggestedFollowUpActions: string[];
  applySuccessPredictionScore?: number;
  recruiterComment?: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  details?: string;
}

export interface SubmittedApplication {
  _id: string;
  userEmail: string;
  jobId: string;
  automationRunId: string;
  jobInfo: {
    title: string;
    company: string;
    location?: string;
    employmentType?: string;
    description?: string;
    applyLink?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
  };
  submissionDate: string;
  applicationUrl?: string;
  confirmationScreenshot?: string;
  resumeVersionUrl?: string;
  coverLetterText?: string;
  generatedAnswers: GeneratedAnswer[];
  matchScore?: number;
  applyReadinessScore?: number;
  aiPrediction?: AIPrediction;
  status: 'submitted' | 'interviewing' | 'rejected' | 'offer' | 'withdrawn';
  followUpNotes?: string;
  timeline: TimelineEvent[];
}
