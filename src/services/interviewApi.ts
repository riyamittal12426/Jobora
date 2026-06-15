import type {
  FinalInterviewReport,
  InterviewAnswerResponse,
  InterviewHistoryItem,
  InterviewSessionStart,
  InterviewSettings,
  ResumeAnalysisData,
} from '@/types/interview';

import { API_BASE_URL } from './apiConfig';

const API_BASE = `${API_BASE_URL}/api`;

const getHeaders = (hasBody = true) => {
  const token = localStorage.getItem('token');
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
}

export const interviewApi = {
  getResumeAnalysis: (email: string) =>
    fetch(`${API_BASE}/interview/resume-analysis/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then((res) =>
      handleResponse<ResumeAnalysisData>(res)
    ),

  startInterview: (userEmail: string, settings: InterviewSettings) =>
    fetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ userEmail, settings }),
    }).then((res) => handleResponse<InterviewSessionStart>(res)),

  submitAnswer: (interviewId: string, answer: string) =>
    fetch(`${API_BASE}/interview/${interviewId}/answer`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ answer }),
    }).then((res) => handleResponse<InterviewAnswerResponse>(res)),

  getHistory: (email: string) =>
    fetch(`${API_BASE}/interview/history/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then((res) =>
      handleResponse<InterviewHistoryItem[]>(res)
    ),

  getInterview: (id: string) =>
    fetch(`${API_BASE}/interview/${id}`, { headers: getHeaders(false) }).then((res) =>
      handleResponse<{ finalReport?: FinalInterviewReport; settings: InterviewSettings }>(res)
    ),
};
