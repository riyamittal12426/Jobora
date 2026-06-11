import { useCallback, useEffect, useState } from 'react';
import { jobApi } from '@/services/jobApi';
import type { JobRecommendationSession, SavedJobRecord } from '@/types/jobs';

export function useJobRecommendations(userEmail: string) {
  const [session, setSession] = useState<JobRecommendationSession | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    if (!userEmail) return;
    try {
      const saved = await jobApi.getSavedJobs(userEmail);
      setSavedJobs(saved);
    } catch {
      setSavedJobs([]);
    }
  }, [userEmail]);

  const loadSession = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const data = await jobApi.getRecommendations(userEmail);
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const generate = useCallback(async () => {
    if (!userEmail) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await jobApi.generateRecommendations(userEmail);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  }, [userEmail]);

  const toggleSave = useCallback(
    async (jobId: string, job: SavedJobRecord['job'], analysis: SavedJobRecord['analysis']) => {
      const existing = savedJobs.find((s) => s.jobId === jobId);
      if (existing) {
        await jobApi.unsaveJob(existing._id);
        setSavedJobs((prev) => prev.filter((s) => s._id !== existing._id));
      } else {
        const saved = await jobApi.saveJob(userEmail, jobId, job, analysis);
        setSavedJobs((prev) => [saved, ...prev]);
      }
    },
    [userEmail, savedJobs]
  );

  const isSaved = useCallback((jobId: string) => savedJobs.some((s) => s.jobId === jobId), [savedJobs]);

  useEffect(() => {
    loadSession();
    loadSaved();
  }, [loadSession, loadSaved]);

  return { session, savedJobs, loading, generating, error, generate, loadSession, toggleSave, isSaved, setError };
}
