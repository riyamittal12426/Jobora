import { useCallback, useState } from 'react';
import { predictionApi } from '@/services/predictionApi';
import type { SuccessPredictionData, SuccessPredictionRecord } from '@/types/prediction';
import type { JobListing } from '@/types/jobs';

export function useSuccessPrediction(userEmail: string) {
  const [prediction, setPrediction] = useState<SuccessPredictionData | null>(null);
  const [history, setHistory] = useState<SuccessPredictionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (job: JobListing, force = false) => {
    if (!userEmail) return;
    setPredicting(true);
    setError(null);
    try {
      const data = await predictionApi.predict(userEmail, job, force);
      setPrediction(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch success prediction.');
      throw err;
    } finally {
      setPredicting(false);
    }
  }, [userEmail]);

  const loadHistory = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const data = await predictionApi.getHistory(userEmail);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prediction history.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const loadCachedPrediction = useCallback(async (jobId: string) => {
    if (!userEmail || !jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await predictionApi.getCached(userEmail, jobId);
      setPrediction(data);
      return data;
    } catch {
      // If error (e.g. 404 not found), set null
      setPrediction(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const runSimulation = useCallback(async (job: JobListing, modifications: { type: string; value: string | number }[]) => {
    if (!userEmail) return;
    setSimulating(true);
    setError(null);
    try {
      const data = await predictionApi.simulate(userEmail, job, modifications);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run simulator.');
      throw err;
    } finally {
      setSimulating(false);
    }
  }, [userEmail]);

  const removePrediction = useCallback(async (id: string) => {
    try {
      await predictionApi.deletePrediction(id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prediction.');
    }
  }, []);

  return {
    prediction,
    history,
    loading,
    predicting,
    simulating,
    error,
    getPrediction,
    loadHistory,
    loadCachedPrediction,
    runSimulation,
    removePrediction,
    setError,
  };
}
