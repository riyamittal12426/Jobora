import type {
  FinalInterviewReport,
  InterviewAnswerResponse,
  InterviewHistoryItem,
  InterviewSessionStart,
  InterviewSettings,
  ResumeAnalysisData,
} from '@/types/interview';
import axiosInstance from './axiosInstance';

const API_BASE = '/api/interview';

export const interviewApi = {
  getResumeAnalysis: (email: string) =>
    axiosInstance.get<ResumeAnalysisData>(`${API_BASE}/resume-analysis/${encodeURIComponent(email)}`).then(res => res.data),

  startInterview: (userEmail: string, settings: InterviewSettings) =>
    axiosInstance.post<InterviewSessionStart>(`${API_BASE}/start`, { userEmail, settings }).then(res => res.data),

  submitAnswer: (interviewId: string, answer: string) =>
    axiosInstance.post<InterviewAnswerResponse>(`${API_BASE}/${interviewId}/answer`, { answer }).then(res => res.data),

  getHistory: (email: string) =>
    axiosInstance.get<InterviewHistoryItem[]>(`${API_BASE}/history/${encodeURIComponent(email)}`).then(res => res.data),

  getInterview: (id: string) =>
    axiosInstance.get<{ finalReport?: FinalInterviewReport; settings: InterviewSettings }>(`${API_BASE}/${id}`).then(res => res.data),
};
