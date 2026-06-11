import type {
  FinalInterviewReport,
  InterviewAnswerResponse,
  InterviewHistoryItem,
  InterviewSessionStart,
  InterviewSettings,
  ResumeAnalysisData,
} from '@/types/interview';

const API_BASE = 'http://localhost:5000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
}

export const interviewApi = {
  getResumeAnalysis: (email: string) =>
    fetch(`${API_BASE}/interview/resume-analysis/${encodeURIComponent(email)}`).then((res) =>
      handleResponse<ResumeAnalysisData>(res)
    ),

  startInterview: (userEmail: string, settings: InterviewSettings) =>
    fetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, settings }),
    }).then((res) => handleResponse<InterviewSessionStart>(res)),

  submitAnswer: (interviewId: string, answer: string) =>
    fetch(`${API_BASE}/interview/${interviewId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    }).then((res) => handleResponse<InterviewAnswerResponse>(res)),

  getHistory: (email: string) =>
    fetch(`${API_BASE}/interview/history/${encodeURIComponent(email)}`).then((res) =>
      handleResponse<InterviewHistoryItem[]>(res)
    ),

  getInterview: (id: string) =>
    fetch(`${API_BASE}/interview/${id}`).then((res) =>
      handleResponse<{ finalReport?: FinalInterviewReport; settings: InterviewSettings }>(res)
    ),
};
