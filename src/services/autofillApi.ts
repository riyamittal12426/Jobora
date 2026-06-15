import type {
  CandidateProfile,
  PreparedApplication,
  DetectedFormField
} from '@/types/autofill';
import type { JobListing } from '@/types/jobs';

import { API_BASE_URL } from './apiConfig';

const API = `${API_BASE_URL}/api/applications/autofill`;

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

export const autofillApi = {
  getCandidateProfile: (email: string) =>
    fetch(`${API}/profile/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then(r => handle<CandidateProfile>(r)),

  updateCandidateProfile: (email: string, profile: CandidateProfile) =>
    fetch(`${API}/profile/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(profile)
    }).then(r => handle<CandidateProfile>(r)),

  extractProfileFromResume: (email: string) =>
    fetch(`${API}/profile/${encodeURIComponent(email)}/extract`, {
      method: 'POST',
      headers: getHeaders(false)
    }).then(r => handle<CandidateProfile>(r)),

  prepareApplication: (email: string, job: JobListing) =>
    fetch(`${API}/generate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ userEmail: email, job })
    }).then(r => handle<PreparedApplication>(r)),

  getApplicationHistory: (email: string) =>
    fetch(`${API}/history/${encodeURIComponent(email)}`, { headers: getHeaders(false) }).then(r => handle<PreparedApplication[]>(r)),

  getApplication: (id: string) =>
    fetch(`${API}/${id}`, { headers: getHeaders(false) }).then(r => handle<PreparedApplication>(r)),

  updateApplication: (id: string, app: Partial<PreparedApplication>) =>
    fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(app)
    }).then(r => handle<PreparedApplication>(r)),

  regenerateContent: (
    id: string,
    type: 'answer' | 'cover_letter',
    details?: { questionIndex?: number; fieldKey?: string }
  ) =>
    fetch(`${API}/${id}/regenerate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ type, ...details })
    }).then(r => handle<PreparedApplication>(r)),

  detectFields: (url: string) =>
    fetch(`${API}/detect-fields`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ url })
    }).then(r => handle<{ portal: string; fields: DetectedFormField[] }>(r))
};
