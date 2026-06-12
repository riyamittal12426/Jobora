import express from 'express';
import mongoose from 'mongoose';
import AutomationRun from '../models/AutomationRun.js';
import SubmittedApplication from '../models/SubmittedApplication.js';
import {
  startAutomationRun,
  approveAndSubmit,
  resumeAutofillAfterCaptcha,
  skipJob,
  retryJob,
  cancelRun,
  automationEvents
} from '../services/automationService.js';

const router = express.Router();

// 1. POST /api/automation/start - Create and start a new automation run
router.post('/start', async (req, res) => {
  try {
    const { userEmail, jobs } = req.body;
    if (!userEmail || !jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ message: 'Missing userEmail or jobs array.' });
    }

    // Map input jobs to the schema structure
    const jobEntries = jobs.map(job => ({
      jobId: job.jobId || job.id,
      jobInfo: {
        title: job.title || job.jobInfo?.title || 'Unknown Role',
        company: job.company || job.jobInfo?.company || 'Unknown Company',
        location: job.location || job.jobInfo?.location || 'Remote',
        employmentType: job.employmentType || job.jobInfo?.employmentType || 'Full-time',
        description: job.description || job.jobInfo?.description || '',
        applyLink: job.applyLink || job.jobInfo?.applyLink || '',
        salaryMin: job.salaryMin || job.jobInfo?.salaryMin || null,
        salaryMax: job.salaryMax || job.jobInfo?.salaryMax || null,
        salaryCurrency: job.salaryCurrency || job.jobInfo?.salaryCurrency || 'USD'
      },
      status: 'queued',
      platform: 'generic', // Will be detected by orchestrator
      detectedFields: [],
      generatedAnswers: [],
      automationLog: [{ timestamp: new Date(), level: 'info', message: 'Job queued for automation' }],
      matchScore: job.matchScore || 50,
      applyReadinessScore: job.applyReadinessScore || 50
    }));

    const run = await AutomationRun.create({
      userEmail,
      status: 'queued',
      jobs: jobEntries,
      progress: {
        total: jobEntries.length,
        completed: 0,
        failed: 0,
        skipped: 0,
        currentIndex: -1
      }
    });

    // Fire off the automation run in the background (non-blocking)
    startAutomationRun(run._id).catch(err => {
      console.error(`[Automation] Error starting run ${run._id}:`, err.message);
    });

    res.status(201).json(run);
  } catch (error) {
    console.error('Error starting automation run:', error);
    res.status(500).json({ message: error.message || 'Failed to start automation.' });
  }
});

// 2. GET /api/automation/run/:runId - Get full run details
router.get('/run/:runId', async (req, res) => {
  try {
    const run = await AutomationRun.findById(req.params.runId);
    if (!run) {
      return res.status(404).json({ message: 'Automation run not found.' });
    }
    res.json(run);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. GET /api/automation/runs/:email - List all runs for a user
router.get('/runs/:email', async (req, res) => {
  try {
    const runs = await AutomationRun.find({ userEmail: req.params.email })
      .sort({ createdAt: -1 });
    res.json(runs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. POST /api/automation/run/:runId/job/:jobIndex/approve - Approve and submit a specific job or resume after CAPTCHA
router.post('/run/:runId/job/:jobIndex/approve', async (req, res) => {
  try {
    const { runId, jobIndex } = req.params;
    
    // Retrieve the run to determine current status
    const run = await AutomationRun.findById(runId);
    if (!run) return res.status(404).json({ message: 'Run not found.' });

    const job = run.jobs[parseInt(jobIndex, 10)];
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    if (job.status === 'captcha_detected' || job.status === 'CAPTCHA_REQUIRED') {
      await resumeAutofillAfterCaptcha(runId, parseInt(jobIndex, 10));
      res.json({ success: true, message: 'CAPTCHA bypassed. Form autofill resumed.' });
    } else {
      await approveAndSubmit(runId, parseInt(jobIndex, 10));
      res.json({ success: true, message: 'Job approved and submission initiated.' });
    }
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ message: error.message });
  }
});

// 4.6 POST /api/automation/run/:runId/job/:jobIndex/resume - Resume automation after manual CAPTCHA solving
router.post('/run/:runId/job/:jobIndex/resume', async (req, res) => {
  try {
    const { runId, jobIndex } = req.params;
    await resumeAutofillAfterCaptcha(runId, parseInt(jobIndex, 10));
    res.json({ success: true, message: 'Form autofill resumed successfully.' });
  } catch (error) {
    console.error('Error resuming job after captcha:', error);
    res.status(500).json({ message: error.message });
  }
});

// 5. POST /api/automation/run/:runId/job/:jobIndex/skip - Skip a job
router.post('/run/:runId/job/:jobIndex/skip', async (req, res) => {
  try {
    const { runId, jobIndex } = req.params;
    await skipJob(runId, parseInt(jobIndex, 10));
    res.json({ success: true, message: 'Job skipped.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. POST /api/automation/run/:runId/job/:jobIndex/retry - Retry a failed job
router.post('/run/:runId/job/:jobIndex/retry', async (req, res) => {
  try {
    const { runId, jobIndex } = req.params;
    const run = await retryJob(runId, parseInt(jobIndex, 10));
    res.json({ success: true, message: 'Job retry scheduled.', run });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6.5 PUT /api/automation/run/:runId/job/:jobIndex - Update a job's form fields or custom answers
router.put('/run/:runId/job/:jobIndex', async (req, res) => {
  try {
    const { runId, jobIndex } = req.params;
    const { detectedFields, generatedAnswers } = req.body;
    
    const run = await AutomationRun.findById(runId);
    if (!run) return res.status(404).json({ message: 'Run not found.' });
    
    const job = run.jobs[parseInt(jobIndex, 10)];
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    
    if (detectedFields) job.detectedFields = detectedFields;
    if (generatedAnswers) job.generatedAnswers = generatedAnswers;
    
    await run.save();
    res.json({ success: true, message: 'Job details updated successfully.', run });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. POST /api/automation/run/:runId/cancel - Cancel the entire run
router.post('/run/:runId/cancel', async (req, res) => {
  try {
    await cancelRun(req.params.runId);
    res.json({ success: true, message: 'Automation run cancelled.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8. GET /api/automation/run/:runId/events - SSE stream for real-time progress updates
router.get('/run/:runId/events', (req, res) => {
  const { runId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const eventListener = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const channel = `run:${runId}`;
  automationEvents.on(channel, eventListener);

  // Keep connection alive with simple comments
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    automationEvents.off(channel, eventListener);
  });
});

// 9. GET /api/automation/submitted/:param - Get submissions list OR details by ID
// Resolves conflicts between /submitted/:email and /submitted/:id dynamically
router.get('/submitted/:param', async (req, res) => {
  try {
    const { param } = req.params;

    if (mongoose.Types.ObjectId.isValid(param)) {
      // It is an ID, find specific submission details
      const submission = await SubmittedApplication.findById(param);
      if (!submission) {
        return res.status(404).json({ message: 'Submitted application not found.' });
      }
      return res.json(submission);
    } else {
      // It is an email, find all submissions for the user
      const list = await SubmittedApplication.find({ userEmail: param })
        .sort({ submissionDate: -1 });
      return res.json(list);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 9.5 PUT /api/automation/submitted/:id - Update status and follow-up notes for a submission
router.put('/submitted/:id', async (req, res) => {
  try {
    const { status, followUpNotes, timeline } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (followUpNotes !== undefined) updateData.followUpNotes = followUpNotes;
    if (timeline) updateData.timeline = timeline;

    const submission = await SubmittedApplication.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ message: 'Submitted application not found.' });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 10. GET /api/automation/run/:runId/job/:jobIndex/screenshot - Get pre-submission screenshot
router.get('/run/:runId/job/:jobIndex/screenshot', async (req, res) => {
  try {
    const { runId, jobIndex } = req.params;
    const run = await AutomationRun.findById(runId);
    if (!run) return res.status(404).json({ message: 'Run not found.' });

    const job = run.jobs[parseInt(jobIndex, 10)];
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const screenshot = job.screenshots?.preSubmission || job.screenshots?.error;
    if (!screenshot) {
      return res.status(404).json({ message: 'No screenshot available.' });
    }

    // Check if it is a base64 Data URL (e.g. data:image/png;base64,...)
    if (screenshot.startsWith('data:')) {
      const matches = screenshot.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      }
    } else {
      // It is a raw base64 string, convert to binary image/jpeg buffer
      const buffer = Buffer.from(screenshot, 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length
      });
      return res.end(buffer);
    }

    res.json({ screenshot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
