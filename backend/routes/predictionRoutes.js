import express from 'express';
import SuccessPrediction from '../models/SuccessPrediction.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { buildCandidateProfile } from '../services/jobGroqService.js';
import { generateSuccessPrediction, simulateSuccessPrediction } from '../services/predictionGroqService.js';

const router = express.Router();

// Helper to get resume analysis
async function getResumeOrFail(email, res) {
  const resumeData = await ResumeAnalysis.findOne({ userEmail: email });
  if (!resumeData) {
    res.status(400).json({ message: 'Complete resume analysis before using success predictor.' });
    return null;
  }
  return resumeData;
}

// POST: Run prediction or get cached
router.post('/:email/predict', async (req, res) => {
  try {
    const { email } = req.params;
    const { job, force = false } = req.body;
    
    if (!job || !job.jobId) {
      return res.status(400).json({ message: 'Job details with jobId are required.' });
    }

    // Check cached prediction first if force is false
    if (!force) {
      const cached = await SuccessPrediction.findOne({ userEmail: email, jobId: job.jobId });
      if (cached) {
        return res.json(cached.prediction);
      }
    }

    const resumeData = await getResumeOrFail(email, res);
    if (!resumeData) return;

    const candidateProfile = buildCandidateProfile(resumeData);
    const predictionResult = await generateSuccessPrediction(candidateProfile, resumeData, job);

    // Store/Update in MongoDB
    const updatedRecord = await SuccessPrediction.findOneAndUpdate(
      { userEmail: email, jobId: job.jobId },
      {
        $set: {
          userEmail: email,
          jobId: job.jobId,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          jobDescription: job.description,
          prediction: predictionResult,
          candidateSnapshot: candidateProfile
        }
      },
      { upsert: true, new: true }
    );

    res.status(201).json(predictionResult);
  } catch (error) {
    console.error('Success prediction error:', error);
    res.status(500).json({ message: error.message || 'Failed to predict application success.' });
  }
});

// GET: Single prediction for a job
router.get('/:email/:jobId', async (req, res) => {
  try {
    const { email, jobId } = req.params;
    const record = await SuccessPrediction.findOne({ userEmail: email, jobId });
    if (!record) {
      return res.status(404).json({ message: 'No success prediction found for this job.' });
    }
    res.json(record.prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get all prediction history for a user
router.get('/:email/history', async (req, res) => {
  try {
    const { email } = req.params;
    const history = await SuccessPrediction.find({ userEmail: email }).sort({ updatedAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Run score simulation (live via Groq, doesn't persist)
router.post('/:email/simulate', async (req, res) => {
  try {
    const { email } = req.params;
    const { job, modifications } = req.body;

    if (!job || !job.jobId || !modifications) {
      return res.status(400).json({ message: 'Job details and modifications array are required.' });
    }

    const resumeData = await getResumeOrFail(email, res);
    if (!resumeData) return;

    const candidateProfile = buildCandidateProfile(resumeData);
    const simulationResult = await simulateSuccessPrediction(candidateProfile, resumeData, job, modifications);

    res.json(simulationResult);
  } catch (error) {
    console.error('Success simulation error:', error);
    res.status(500).json({ message: error.message || 'Failed to run prediction simulation.' });
  }
});

// DELETE: Delete a prediction from history
router.delete('/:id', async (req, res) => {
  try {
    await SuccessPrediction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Prediction deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
