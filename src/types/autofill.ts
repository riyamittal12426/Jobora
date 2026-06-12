export interface EducationItem {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  link: string;
}

export interface CandidateProfile {
  _id?: string;
  userEmail: string;
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  education: EducationItem[];
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: string[];
  achievements: string[];
  resumeText?: string;
  resumeUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutofillAnswer {
  question: string;
  answer: string;
  confidenceScore: number;
  explanation: string;
  fieldKey: string;
}

export interface RecruiterReview {
  predictedReaction: string;
  interviewProbability: 'High' | 'Medium' | 'Low';
  matchScore: number;
  keyStrengths: string[];
  potentialRedFlags: string[];
}

export interface PreparedApplication {
  _id: string;
  userEmail: string;
  jobId: string;
  jobInfo: {
    title: string;
    company: string;
    location?: string;
    employmentType?: string;
    description?: string;
    applyLink?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string;
  };
  candidateProfileSnapshot: CandidateProfile;
  answers: AutofillAnswer[];
  coverLetter: string;
  recruiterReview: RecruiterReview;
  status: 'Draft' | 'Ready' | 'Submitted';
  createdAt: string;
  updatedAt: string;
}

export interface DetectedFormField {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  label: string;
  required: boolean;
}
