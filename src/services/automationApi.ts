import type { AutomationRun, SubmittedApplication } from '@/types/automation';

import { API_BASE_URL } from './apiConfig';

const API = `${API_BASE_URL}/api/automation`;

const getHeaders = (hasBody = true) => {
  const token = localStorage.getItem('token');
  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const automationApi = {
  startRun: (email: string, jobs: any[]) =>
    fetch(`${API}/start`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ userEmail: email, jobs })
    }).then(r => handle<AutomationRun>(r)),

  getRun: (runId: string) =>
    fetch(`${API}/run/${runId}`, { headers: getHeaders(false) }).then(r => handle<AutomationRun>(r)),

  getRuns: (email: string) =>
    fetch(`${API}/runs/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then(r => handle<AutomationRun[]>(r)),

  approveJob: (runId: string, jobIndex: number) =>
    fetch(`${API}/run/${runId}/job/${jobIndex}/approve`, {
      method: 'POST',
      headers: getHeaders(false)
    }).then(r => handle<{ success: boolean; message: string }>(r)),

  resumeJob: (runId: string, jobIndex: number) =>
    fetch(`${API}/run/${runId}/job/${jobIndex}/resume`, {
      method: 'POST',
      headers: getHeaders(false)
    }).then(r => handle<{ success: boolean; message: string }>(r)),

  skipJob: (runId: string, jobIndex: number) =>
    fetch(`${API}/run/${runId}/job/${jobIndex}/skip`, {
      method: 'POST',
      headers: getHeaders(false)
    }).then(r => handle<{ success: boolean; message: string }>(r)),

  retryJob: (runId: string, jobIndex: number) =>
    fetch(`${API}/run/${runId}/job/${jobIndex}/retry`, {
      method: 'POST',
      headers: getHeaders(false)
    }).then(r => handle<{ success: boolean; message: string; run: AutomationRun }>(r)),

  updateJobDetails: (runId: string, jobIndex: number, data: { detectedFields?: any[]; generatedAnswers?: any[] }) =>
    fetch(`${API}/run/${runId}/job/${jobIndex}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data)
    }).then(r => handle<{ success: boolean; message: string; run: AutomationRun }>(r)),

  cancelRun: (runId: string) =>
    fetch(`${API}/run/${runId}/cancel`, {
      method: 'POST',
      headers: getHeaders(false)
    }).then(r => handle<{ success: boolean; message: string }>(r)),

  getSubmittedApplications: (email: string) =>
    fetch(`${API}/submitted/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then(r => handle<SubmittedApplication[]>(r)),

  getSubmittedApplication: (id: string) =>
    fetch(`${API}/submitted/${id}`, { headers: getHeaders(false) }).then(r => handle<SubmittedApplication>(r)),

  updateSubmittedApplication: (id: string, data: { status?: string; followUpNotes?: string; timeline?: any[] }) =>
    fetch(`${API}/submitted/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data)
    }).then(r => handle<SubmittedApplication>(r)),

  getScreenshotUrl: (runId: string, jobIndex: number) => {
    return `${API}/run/${runId}/job/${jobIndex}/screenshot`;
  },

  subscribeToEvents: (runId: string, onEvent: (payload: { event: string; data: any; timestamp: string }) => void) => {
    const eventSource = new EventSource(`${API}/run/${runId}/events`);
    
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
