import express from 'express';
import CandidateProfile from '../models/CandidateProfile.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { parseResumeToStructuredData, generateCoverLetter, generateOutreachEmail, generateTailoredResumeBullets, generateNetworkingStrategy, analyzeJobMatch, buildCandidateProfile } from '../services/jobGroqService.js';
import { generateAutofillAnswers } from '../services/autofillService.js';

const router = express.Router();

// 1. Get Candidate Profile (Structured Data)
router.get('/profile/:email', verifyFirebaseToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) return res.status(403).json({ message: 'Access denied.' });
    
    let profile = await CandidateProfile.findOne({ userEmail: req.params.email });
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Save/Update Candidate Profile manually
router.post('/profile/:email', verifyFirebaseToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) return res.status(403).json({ message: 'Access denied.' });
    
    const updated = await CandidateProfile.findOneAndUpdate(
      { userEmail: req.params.email },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. AI Parsing: Extract structured data from raw Resume Text
router.post('/parse/:email', verifyFirebaseToken, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) return res.status(403).json({ message: 'Access denied.' });
    
    // Find their latest resume text
    const resumeData = await ResumeAnalysis.findOne({ userEmail: req.params.email });
    if (!resumeData || !resumeData.resumeText) {
      return res.status(400).json({ message: 'No uploaded resume found. Please upload a resume first.' });
    }

    const structuredData = await parseResumeToStructuredData(resumeData.resumeText);
    
    // Save to DB
    const profile = await CandidateProfile.findOneAndUpdate(
      { userEmail: req.params.email },
      { 
        $set: {
          userEmail: req.params.email,
          ...structuredData
        }
      },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ message: 'Failed to structure resume.' });
  }
});

// 4. Generate AI Cover Letter
router.post('/cover-letter', verifyFirebaseToken, async (req, res) => {
  try {
    const { profile, jobDescription, companyName, jobTitle } = req.body;
    
    if (!profile || !jobDescription) {
      return res.status(400).json({ message: 'Profile and Job Description are required.' });
    }

    const result = await generateCoverLetter(profile, jobDescription, companyName || 'Company', jobTitle || 'Target Role');
    res.json({ coverLetter: result.coverLetter });
  } catch (error) {
    console.error('Cover Letter error:', error);
    res.status(500).json({ message: 'Failed to generate cover letter.' });
  }
});

// 5. Generate Outreach Email
router.post('/email-outreach', verifyFirebaseToken, async (req, res) => {
  try {
    const { type, context } = req.body;
    
    if (!type || !context) {
      return res.status(400).json({ message: 'Type and Context are required.' });
    }

    const result = await generateOutreachEmail(type, context);
    res.json(result);
  } catch (error) {
    console.error('Email Outreach error:', error);
    res.status(500).json({ message: 'Failed to generate email.' });
  }
});

// 6. Generate Full Application Kit (Tailored Resume + Cover Letter + Screening Answers + Match Analysis)
router.post('/application-kit', verifyFirebaseToken, async (req, res) => {
  try {
    const { userEmail, job } = req.body;
    if (!userEmail || !job) {
      return res.status(400).json({ message: 'userEmail and job are required.' });
    }

    const profile = await CandidateProfile.findOne({ userEmail });
    if (!profile) {
      return res.status(400).json({ message: 'No candidate profile found. Please set up your profile first.' });
    }

    const resumeData = await ResumeAnalysis.findOne({ userEmail });

    // Run AI generation in parallel for speed
    const [tailoredResume, coverLetterResult, matchAnalysis] = await Promise.all([
      generateTailoredResumeBullets(profile.toObject(), job),
      generateCoverLetter(
        profile.toObject(),
        job.description || job.jobDescription || '',
        job.company || job.companyName || 'Company',
        job.title || job.jobTitle || 'Target Role'
      ),
      resumeData
        ? analyzeJobMatch(buildCandidateProfile(resumeData), job)
        : Promise.resolve(null)
    ]);

    // Generate screening answers
    let screeningAnswers = [];
    try {
      const answersResult = await generateAutofillAnswers(profile.toObject(), job);
      screeningAnswers = answersResult.answers || [];
    } catch (ansErr) {
      console.warn('[Application Kit] Screening answers generation failed, continuing:', ansErr.message);
    }

    res.json({
      tailoredResume,
      coverLetter: coverLetterResult.coverLetter || coverLetterResult.CoverLetter || '',
      screeningAnswers,
      matchAnalysis,
      jobInfo: {
        title: job.title || job.jobTitle || '',
        company: job.company || job.companyName || '',
        location: job.location || '',
        applyLink: job.applyLink || job.url || ''
      }
    });
  } catch (error) {
    console.error('[Application Kit] Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate application kit.' });
  }
});

// 7. Generate Networking Strategy for a Target Job
router.post('/networking-strategy', verifyFirebaseToken, async (req, res) => {
  try {
    const { userEmail, job } = req.body;
    if (!userEmail || !job) {
      return res.status(400).json({ message: 'userEmail and job are required.' });
    }

    const profile = await CandidateProfile.findOne({ userEmail });
    if (!profile) {
      return res.status(400).json({ message: 'No candidate profile found. Please set up your profile first.' });
    }

    const strategy = await generateNetworkingStrategy(profile.toObject(), job);
    res.json(strategy);
  } catch (error) {
    console.error('[Networking Strategy] Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate networking strategy.' });
  }
});

export default router;
