import type { SuccessPredictionData, SuccessPredictionRecord } from '@/types/prediction';
import type { JobListing } from '@/types/jobs';
import axiosInstance from './axiosInstance';

const API = '/api/prediction';

export const predictionApi = {
  predict: (email: string, job: JobListing, force = false) =>
    axiosInstance.post<SuccessPredictionData>(`${API}/${encodeURIComponent(email)}/predict`, { job, force }).then(res => res.data),

  getCached: (email: string, jobId: string) =>
    axiosInstance.get<SuccessPredictionData>(`${API}/${encodeURIComponent(email)}/${encodeURIComponent(jobId)}`).then(res => res.data),

  getHistory: (email: string) =>
    axiosInstance.get<SuccessPredictionRecord[]>(`${API}/${encodeURIComponent(email)}/history`).then(res => res.data),

  simulate: (email: string, job: JobListing, modifications: { type: string; value: string | number }[]) =>
    axiosInstance.post<SuccessPredictionData>(`${API}/${encodeURIComponent(email)}/simulate`, { job, modifications }).then(res => res.data),

  deletePrediction: (id: string) =>
    axiosInstance.delete<{ message: string }>(`${API}/${id}`).then(res => res.data),
};
