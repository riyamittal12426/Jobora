import { useState, useEffect, useCallback, useRef } from 'react';
import { automationApi } from '@/services/automationApi';
import type { AutomationRun, AutomationLog, JobAutomationEntry } from '@/types/automation';

export function useAutomation(userEmail: string) {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [activeRun, setActiveRun] = useState<AutomationRun | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sseUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load run history
  const fetchRuns = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const data = await automationApi.getRuns(userEmail);
      setRuns(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch automation history.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Fetch a specific run details
  const fetchRun = useCallback(async (runId: string) => {
    try {
      const run = await automationApi.getRun(runId);
      setActiveRun(run);
      // Aggregate logs from all processed jobs for visual convenience
      const allLogs: AutomationLog[] = [];
      run.jobs.forEach((job: JobAutomationEntry) => {
        if (job.automationLog) {
          job.automationLog.forEach(l => {
            allLogs.push({
              ...l,
              message: `[${job.jobInfo.company}] ${l.message}`
            });
          });
        }
      });
      // Sort logs by timestamp
      allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setLogs(allLogs);
      return run;
    } catch (err: any) {
      console.error('Error fetching run:', err);
    }
    return null;
  }, []);

  // SSE subscription setup
  const subscribeToRunEvents = useCallback((runId: string) => {
    // Clean up any existing connection first
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current();
    }

    const unsubscribe = automationApi.subscribeToEvents(runId, async (payload) => {
      // Add standard SSE log entry
      const logMessage = `[Event: ${payload.event}] ${typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data || '')}`;
      console.log(`[SSE] ${logMessage}`);
      
      // Re-fetch the full run to stay in sync with the backend
      const updatedRun = await fetchRun(runId);
      
      if (updatedRun) {
        // If the run has finished or failed, close the connection
        if (['completed', 'cancelled', 'failed'].includes(updatedRun.status)) {
          if (sseUnsubscribeRef.current) {
            sseUnsubscribeRef.current();
            sseUnsubscribeRef.current = null;
          }
        }
      }
    });

    sseUnsubscribeRef.current = unsubscribe;
  }, [fetchRun]);

  // Start automation
  const startRun = async (jobs: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const newRun = await automationApi.startRun(userEmail, jobs);
      setActiveRun(newRun);
      setLogs([{
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Automation run queued successfully.'
      }]);
      subscribeToRunEvents(newRun._id);
      fetchRuns(); // refresh history list
      return newRun;
    } catch (err: any) {
      setError(err.message || 'Failed to start automation run.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve a job
  const approveJob = async (runId: string, jobIndex: number) => {
    setError(null);
    try {
      await automationApi.approveJob(runId, jobIndex);
      // Wait briefly for server state update, then re-fetch
      setTimeout(() => fetchRun(runId), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to approve job.');
    }
  };

  // Resume a job after CAPTCHA
  const resumeJob = async (runId: string, jobIndex: number) => {
    setError(null);
    try {
      await automationApi.resumeJob(runId, jobIndex);
      setTimeout(() => fetchRun(runId), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to resume job.');
    }
  };

  // Skip a job
  const skipJob = async (runId: string, jobIndex: number) => {
    setError(null);
    try {
      await automationApi.skipJob(runId, jobIndex);
      setTimeout(() => fetchRun(runId), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to skip job.');
    }
  };

  // Retry a job
  const retryJob = async (runId: string, jobIndex: number) => {
    setError(null);
    try {
      const result = await automationApi.retryJob(runId, jobIndex);
      // Re-subscribe if needed
      subscribeToRunEvents(runId);
      setTimeout(() => fetchRun(runId), 500);
      return result.run;
    } catch (err: any) {
      setError(err.message || 'Failed to retry job.');
    }
  };

  // Cancel a run
  const cancelRun = async (runId: string) => {
    setError(null);
    try {
      await automationApi.cancelRun(runId);
      if (sseUnsubscribeRef.current) {
        sseUnsubscribeRef.current();
        sseUnsubscribeRef.current = null;
      }
      setTimeout(() => fetchRun(runId), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel run.');
    }
  };

  // Update job details (detected fields or custom answers)
  const updateJobDetails = async (
    runId: string,
    jobIndex: number,
    data: { detectedFields?: any[]; generatedAnswers?: any[] }
  ) => {
    setError(null);
    try {
      const result = await automationApi.updateJobDetails(runId, jobIndex, data);
      setActiveRun(result.run);
      await fetchRun(runId);
      return result.run;
    } catch (err: any) {
      setError(err.message || 'Failed to update job details.');
      throw err;
    }
  };

  // Select a run to view in dashboard
  const selectRun = useCallback((run: AutomationRun) => {
    setActiveRun(run);
    subscribeToRunEvents(run._id);
    fetchRun(run._id);
  }, [fetchRun, subscribeToRunEvents]);

  // Clear active run
  const clearActiveRun = useCallback(() => {
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current();
      sseUnsubscribeRef.current = null;
    }
    setActiveRun(null);
    setLogs([]);
  }, []);

  // Fetch runs on mount
  useEffect(() => {
    fetchRuns();
    return () => {
      if (sseUnsubscribeRef.current) {
        sseUnsubscribeRef.current();
      }
    };
  }, [fetchRuns]);

  return {
    runs,
    activeRun,
    logs,
    loading,
    error,
    startRun,
    approveJob,
    resumeJob,
    skipJob,
    retryJob,
    cancelRun,
    updateJobDetails,
    fetchRun,
    fetchRuns,
    selectRun,
    clearActiveRun
  };
}
