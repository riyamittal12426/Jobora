import type { JobMatchAnalysis, JobRecommendationSession, SavedJobRecord, JobListing } from '@/types/jobs';

import { API_BASE_URL } from './apiConfig';

const API = `${API_BASE_URL}/api/jobs`;

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

export const jobApi = {
  getRecommendations: (email: string) =>
    fetch(`${API}/recommendations/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then((r) => handle<JobRecommendationSession>(r)),

  generateRecommendations: (email: string) =>
    fetch(`${API}/recommendations/${encodeURIComponent(email)}/generate`, { 
      method: 'POST',
      headers: getHeaders(false)
    }).then((r) => handle<JobRecommendationSession>(r)),

  analyzeJobDescription: (email: string, jobDescription: string, jobTitle?: string) =>
    fetch(`${API}/analyze-jd/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ jobDescription, jobTitle }),
    }).then((r) => handle<{ analysis: JobMatchAnalysis }>(r)),

  getSavedJobs: (email: string) =>
    fetch(`${API}/saved/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then((r) => handle<SavedJobRecord[]>(r)),

  saveJob: (userEmail: string, jobId: string, job: JobListing, analysis: JobMatchAnalysis) =>
    fetch(`${API}/saved`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ userEmail, jobId, job, analysis }),
    }).then((r) => handle<SavedJobRecord>(r)),

  unsaveJob: (id: string) =>
    fetch(`${API}/saved/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(false)
    }).then((r) => handle<{ message: string }>(r)),
};
