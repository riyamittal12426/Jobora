import type { AutomationRun, SubmittedApplication } from '@/types/automation';
import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './apiConfig';

const API = '/api/automation';

export const automationApi = {
  startRun: (email: string, jobs: any[]) =>
    axiosInstance.post<AutomationRun>(`${API}/start`, { userEmail: email, jobs }).then(res => res.data),

  getRun: (runId: string) =>
    axiosInstance.get<AutomationRun>(`${API}/run/${runId}`).then(res => res.data),

  getRuns: (email: string) =>
    axiosInstance.get<AutomationRun[]>(`${API}/runs/${encodeURIComponent(email)}`).then(res => res.data),

  approveJob: (runId: string, jobIndex: number) =>
    axiosInstance.post<{ success: boolean; message: string }>(`${API}/run/${runId}/job/${jobIndex}/approve`).then(res => res.data),

  resumeJob: (runId: string, jobIndex: number) =>
    axiosInstance.post<{ success: boolean; message: string }>(`${API}/run/${runId}/job/${jobIndex}/resume`).then(res => res.data),

  skipJob: (runId: string, jobIndex: number) =>
    axiosInstance.post<{ success: boolean; message: string }>(`${API}/run/${runId}/job/${jobIndex}/skip`).then(res => res.data),

  retryJob: (runId: string, jobIndex: number) =>
    axiosInstance.post<{ success: boolean; message: string; run: AutomationRun }>(`${API}/run/${runId}/job/${jobIndex}/retry`).then(res => res.data),

  updateJobDetails: (runId: string, jobIndex: number, data: { detectedFields?: any[]; generatedAnswers?: any[] }) =>
    axiosInstance.put<{ success: boolean; message: string; run: AutomationRun }>(`${API}/run/${runId}/job/${jobIndex}`, data).then(res => res.data),

  cancelRun: (runId: string) =>
    axiosInstance.post<{ success: boolean; message: string }>(`${API}/run/${runId}/cancel`).then(res => res.data),

  getSubmittedApplications: (email: string) =>
    axiosInstance.get<SubmittedApplication[]>(`${API}/submitted/${encodeURIComponent(email)}`).then(res => res.data),

  getSubmittedApplication: (id: string) =>
    axiosInstance.get<SubmittedApplication>(`${API}/submitted/${id}`).then(res => res.data),

  updateSubmittedApplication: (id: string, data: { status?: string; followUpNotes?: string; timeline?: any[] }) =>
    axiosInstance.put<SubmittedApplication>(`${API}/submitted/${id}`, data).then(res => res.data),

  getScreenshotUrl: (runId: string, jobIndex: number) => {
    return `${API_BASE_URL}${API}/run/${runId}/job/${jobIndex}/screenshot`;
  },

  subscribeToEvents: (runId: string, onEvent: (payload: { event: string; data: any; timestamp: string }) => void) => {
    const eventSource = new EventSource(`${API_BASE_URL}${API}/run/${runId}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onEvent(payload);
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE EventSource error:', err);
    };

    return () => {
      eventSource.close();
    };
  }
};
