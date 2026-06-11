import express from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import SavedJob from '../models/SavedJob.js';
import JobRecommendationSession from '../models/JobRecommendationSession.js';
import { fetchRecommendedJobs } from '../services/jsearchService.js';
import {
  buildCandidateProfile,
  analyzeJobMatch,
  analyzeCustomJobDescription,
  generateSkillGapIntelligence,
  generateCareerAdvisor,
  buildApplyReadinessDashboard,
} from '../services/jobGroqService.js';

const router = express.Router();

async function getResumeOrFail(email, res) {
  const resumeData = await ResumeAnalysis.findOne({ userEmail: email });
  if (!resumeData) {
    res.status(400).json({ message: 'Complete resume analysis before using job recommendations.' });
    return null;
  }
  return resumeData;
}

async function analyzeJobsInBatches(candidateProfile, jobs, batchSize = 2) {
  const results = [];
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const analyzed = await Promise.all(
      batch.map(async (job) => {
        const analysis = await analyzeJobMatch(candidateProfile, job);
        return { job, analysis };
      })
    );
    results.push(...analyzed);
  }
  return results.sort((a, b) => b.analysis.matchScore - a.analysis.matchScore);
}

router.get('/recommendations/:email', async (req, res) => {
  try {
    const session = await JobRecommendationSession.findOne({ userEmail: req.params.email })
      .sort({ createdAt: -1 });
    if (!session) {
      return res.status(404).json({ message: 'No recommendations yet. Generate them first.' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/recommendations/:email/generate', async (req, res) => {
  try {
    const resumeData = await getResumeOrFail(req.params.email, res);
    if (!resumeData) return;

    const candidateProfile = buildCandidateProfile(resumeData);
    const rawJobs = await fetchRecommendedJobs(resumeData, 10);

    if (!rawJobs.length) {
      return res.status(404).json({ message: 'No jobs found. Try updating your resume skills.' });
    }

    const jobs = await analyzeJobsInBatches(candidateProfile, rawJobs);
    const skillGapIntelligence = await generateSkillGapIntelligence(candidateProfile, jobs);
    const careerAdvisor = await generateCareerAdvisor(candidateProfile, jobs);
    const applyReadinessDashboard = buildApplyReadinessDashboard(jobs);

    const analytics = {
      topMatchingRoles: skillGapIntelligence.topMatchingRoles || [],
      skillDemandHeatmap: (skillGapIntelligence.rankedSkills || []).map((s) => ({
        skill: s.skill,
        demand: s.demandPercentage,
      })),
      marketAlignmentScore: skillGapIntelligence.marketAlignmentScore || 0,
      averageMatchScore: skillGapIntelligence.averageMatchScore ||
        Math.round(jobs.reduce((a, j) => a + j.analysis.matchScore, 0) / jobs.length),
      categoryScores: skillGapIntelligence.categoryScores || [],
    };

    const session = await JobRecommendationSession.create({
      userEmail: req.params.email,
      candidateProfile,
      jobs,
      skillGapIntelligence,
      careerAdvisor,
      applyReadinessDashboard,
      analytics,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Job recommendation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate recommendations.' });
  }
});

router.post('/analyze-jd/:email', async (req, res) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    if (!jobDescription?.trim()) {
      return res.status(400).json({ message: 'Job description is required.' });
    }

    const resumeData = await getResumeOrFail(req.params.email, res);
    if (!resumeData) return;

    const candidateProfile = buildCandidateProfile(resumeData);
    const analysis = await analyzeCustomJobDescription(candidateProfile, jobDescription, jobTitle);

    res.json({ analysis, candidateProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/saved/:email', async (req, res) => {
  try {
    const saved = await SavedJob.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/saved', async (req, res) => {
  try {
    const { userEmail, jobId, job, analysis } = req.body;
    const saved = await SavedJob.findOneAndUpdate(
      { userEmail, jobId },
      { $set: { job, analysis } },
      { upsert: true, new: true }
    );
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/saved/:id', async (req, res) => {
  try {
    await SavedJob.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job removed from saved list.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
