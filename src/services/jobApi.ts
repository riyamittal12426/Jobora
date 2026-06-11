import type { JobMatchAnalysis, JobRecommendationSession, SavedJobRecord, JobListing } from '@/types/jobs';

const API = 'http://localhost:5000/api/jobs';

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const jobApi = {
  getRecommendations: (email: string) =>
    fetch(`${API}/recommendations/${encodeURIComponent(email)}`).then((r) => handle<JobRecommendationSession>(r)),

  generateRecommendations: (email: string) =>
    fetch(`${API}/recommendations/${encodeURIComponent(email)}/generate`, { method: 'POST' }).then((r) =>
      handle<JobRecommendationSession>(r)
    ),

  analyzeJobDescription: (email: string, jobDescription: string, jobTitle?: string) =>
    fetch(`${API}/analyze-jd/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription, jobTitle }),
    }).then((r) => handle<{ analysis: JobMatchAnalysis }>(r)),

  getSavedJobs: (email: string) =>
    fetch(`${API}/saved/${encodeURIComponent(email)}`).then((r) => handle<SavedJobRecord[]>(r)),

  saveJob: (userEmail: string, jobId: string, job: JobListing, analysis: JobMatchAnalysis) =>
    fetch(`${API}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, jobId, job, analysis }),
    }).then((r) => handle<SavedJobRecord>(r)),

  unsaveJob: (id: string) =>
    fetch(`${API}/saved/${id}`, { method: 'DELETE' }).then((r) => handle<{ message: string }>(r)),
};
