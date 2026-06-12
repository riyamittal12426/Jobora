import type {
  CandidateProfile,
  PreparedApplication,
  DetectedFormField
} from '@/types/autofill';
import type { JobListing } from '@/types/jobs';

const API = 'http://localhost:5000/api/applications/autofill';

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const autofillApi = {
  getCandidateProfile: (email: string) =>
    fetch(`${API}/profile/${encodeURIComponent(email)}`).then(r => handle<CandidateProfile>(r)),

  updateCandidateProfile: (email: string, profile: CandidateProfile) =>
    fetch(`${API}/profile/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }).then(r => handle<CandidateProfile>(r)),

  extractProfileFromResume: (email: string) =>
    fetch(`${API}/profile/${encodeURIComponent(email)}/extract`, {
      method: 'POST'
    }).then(r => handle<CandidateProfile>(r)),

  prepareApplication: (email: string, job: JobListing) =>
    fetch(`${API}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: email, job })
    }).then(r => handle<PreparedApplication>(r)),

  getApplicationHistory: (email: string) =>
    fetch(`${API}/history/${encodeURIComponent(email)}`).then(r => handle<PreparedApplication[]>(r)),

  getApplication: (id: string) =>
    fetch(`${API}/${id}`).then(r => handle<PreparedApplication>(r)),

  updateApplication: (id: string, app: Partial<PreparedApplication>) =>
    fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    }).then(r => handle<PreparedApplication>(r)),

  regenerateContent: (
    id: string,
    type: 'answer' | 'cover_letter',
    details?: { questionIndex?: number; fieldKey?: string }
  ) =>
    fetch(`${API}/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...details })
    }).then(r => handle<PreparedApplication>(r)),

  detectFields: (url: string) =>
    fetch(`${API}/detect-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    }).then(r => handle<{ portal: string; fields: DetectedFormField[] }>(r))
};
