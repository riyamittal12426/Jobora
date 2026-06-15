import type { SuccessPredictionData, SuccessPredictionRecord } from '@/types/prediction';
import type { JobListing } from '@/types/jobs';

import { API_BASE_URL } from './apiConfig';

const API = `${API_BASE_URL}/api/prediction`;

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

export const predictionApi = {
  predict: (email: string, job: JobListing, force = false) =>
    fetch(`${API}/${encodeURIComponent(email)}/predict`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ job, force }),
    }).then((r) => handle<SuccessPredictionData>(r)),

  getCached: (email: string, jobId: string) =>
    fetch(`${API}/${encodeURIComponent(email)}/${encodeURIComponent(jobId)}`, { headers: getHeaders(false) }).then((r) =>
      handle<SuccessPredictionData>(r)
    ),

  getHistory: (email: string) =>
    fetch(`${API}/${encodeURIComponent(email)}/history`, { headers: getHeaders(false) }).then((r) =>
      handle<SuccessPredictionRecord[]>(r)
    ),

  simulate: (email: string, job: JobListing, modifications: { type: string; value: string | number }[]) =>
    fetch(`${API}/${encodeURIComponent(email)}/simulate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ job, modifications }),
    }).then((r) => handle<SuccessPredictionData>(r)),

  deletePrediction: (id: string) =>
    fetch(`${API}/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(false)
    }).then((r) => handle<{ message: string }>(r)),
};
