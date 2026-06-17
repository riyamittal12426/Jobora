import type { JobMatchAnalysis, JobRecommendationSession, SavedJobRecord, JobListing } from '@/types/jobs';
import axiosInstance from './axiosInstance';

const API = '/api/jobs';

export const jobApi = {
  getRecommendations: (email: string) =>
    axiosInstance.get<JobRecommendationSession>(`${API}/recommendations/${encodeURIComponent(email)}`).then(res => res.data),

  generateRecommendations: (email: string) =>
    axiosInstance.post<JobRecommendationSession>(`${API}/recommendations/${encodeURIComponent(email)}/generate`).then(res => res.data),

  analyzeJobDescription: (email: string, jobDescription: string, jobTitle?: string) =>
    axiosInstance.post<{ analysis: JobMatchAnalysis }>(`${API}/analyze-jd/${encodeURIComponent(email)}`, { jobDescription, jobTitle }).then(res => res.data),

  getSavedJobs: (email: string) =>
    axiosInstance.get<SavedJobRecord[]>(`${API}/saved/${encodeURIComponent(email)}`).then(res => res.data),

  saveJob: (userEmail: string, jobId: string, job: JobListing, analysis: JobMatchAnalysis) =>
    axiosInstance.post<SavedJobRecord>(`${API}/saved`, { userEmail, jobId, job, analysis }).then(res => res.data),

  unsaveJob: (id: string) =>
    axiosInstance.delete<{ message: string }>(`${API}/saved/${id}`).then(res => res.data),
};
