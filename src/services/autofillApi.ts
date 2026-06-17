import type {
  CandidateProfile,
  PreparedApplication,
  DetectedFormField
} from '@/types/autofill';
import type { JobListing } from '@/types/jobs';
import axiosInstance from './axiosInstance';

const API = '/api/applications/autofill';

export const autofillApi = {
  getCandidateProfile: (email: string) =>
    axiosInstance.get<CandidateProfile>(`${API}/profile/${encodeURIComponent(email)}`).then(res => res.data),

  updateCandidateProfile: (email: string, profile: CandidateProfile) =>
    axiosInstance.put<CandidateProfile>(`${API}/profile/${encodeURIComponent(email)}`, profile).then(res => res.data),

  extractProfileFromResume: (email: string) =>
    axiosInstance.post<CandidateProfile>(`${API}/profile/${encodeURIComponent(email)}/extract`).then(res => res.data),

  prepareApplication: (email: string, job: JobListing) =>
    axiosInstance.post<PreparedApplication>(`${API}/generate`, { userEmail: email, job }).then(res => res.data),

  getApplicationHistory: (email: string) =>
    axiosInstance.get<PreparedApplication[]>(`${API}/history/${encodeURIComponent(email)}`).then(res => res.data),

  getApplication: (id: string) =>
    axiosInstance.get<PreparedApplication>(`${API}/${id}`).then(res => res.data),

  updateApplication: (id: string, app: Partial<PreparedApplication>) =>
    axiosInstance.put<PreparedApplication>(`${API}/${id}`, app).then(res => res.data),

  regenerateContent: (
    id: string,
    type: 'answer' | 'cover_letter',
    details?: { questionIndex?: number; fieldKey?: string }
  ) =>
    axiosInstance.post<PreparedApplication>(`${API}/${id}/regenerate`, { type, ...details }).then(res => res.data),

  detectFields: (url: string) =>
    axiosInstance.post<{ portal: string; fields: DetectedFormField[] }>(`${API}/detect-fields`, { url }).then(res => res.data)
};
