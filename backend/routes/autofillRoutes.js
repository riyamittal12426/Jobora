import express from 'express';
import CandidateProfile from '../models/CandidateProfile.js';
import PreparedApplication from '../models/PreparedApplication.js';
import User from '../models/User.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import {
  parseProfileFromResume,
  generateAutofillAnswers,
  generateCoverLetter,
  generateRecruiterReview
} from '../services/autofillService.js';
import { detectFormFields } from '../services/formDetectorService.js';
import { chatJson, FAST_MODEL, PRIMARY_MODEL } from '../services/jobGroqService.js';

const router = express.Router();

// Helper to prefill from User model
async function getPrefilledProfile(email) {
  const user = await User.findOne({ email });
  const name = user ? `${user.firstName} ${user.lastName}` : '';
  const phone = user ? user.phone : '';
  
  return {
    userEmail: email,
    name,
    email,
    phone,
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    resumeText: '',
    resumeUrl: user ? user.resume : ''
  };
}

// 1. GET Candidate Profile
router.get('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    let profile = await CandidateProfile.findOne({ userEmail: email });
    if (!profile) {
      profile = await getPrefilledProfile(email);
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. PUT Candidate Profile
router.put('/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const profile = await CandidateProfile.findOneAndUpdate(
      { userEmail: email },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. POST Extract Candidate Profile from Resume Text
router.post('/profile/:email/extract', async (req, res) => {
  try {
    const email = req.params.email;
    const resumeData = await ResumeAnalysis.findOne({ userEmail: email });
    
    if (!resumeData || !resumeData.resumeText) {
      return res.status(400).json({ message: 'No analyzed resume text found. Please analyze your resume first.' });
    }

    console.log(`[Autofill] Extracting candidate profile from resume text for ${email}...`);
    const parsed = await parseProfileFromResume(resumeData.resumeText);
    
    const user = await User.findOne({ email });
    const fallbackName = user ? `${user.firstName} ${user.lastName}` : '';
    const fallbackPhone = user ? user.phone : '';

    const profileData = {
      userEmail: email,
      name: parsed.name || fallbackName,
      email: parsed.email || email,
      phone: parsed.phone || fallbackPhone,
      linkedinUrl: parsed.linkedinUrl || '',
      githubUrl: parsed.githubUrl || '',
      portfolioUrl: parsed.portfolioUrl || '',
      skills: parsed.skills || [],
      education: parsed.education || [],
      experience: parsed.experience || [],
      projects: parsed.projects || [],
      certifications: parsed.certifications || [],
      achievements: parsed.achievements || [],
      resumeText: resumeData.resumeText,
      resumeUrl: resumeData.resumeUrl || (user ? user.resume : '')
    };

    const profile = await CandidateProfile.findOneAndUpdate(
      { userEmail: email },
      { $set: profileData },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('Profile extraction error:', error);
    res.status(500).json({ message: error.message || 'Failed to extract profile from resume.' });
  }
});

// 4. POST Generate Prepared Application Draft
router.post('/generate', async (req, res) => {
  try {
    const { userEmail, job } = req.body;
    if (!userEmail || !job || !job.jobId) {
      return res.status(400).json({ message: 'Missing userEmail or job listing data.' });
    }

    // 1. Fetch Candidate Profile or prefill and extract on the fly if profile is empty
    let profile = await CandidateProfile.findOne({ userEmail });
    if (!profile) {
      const resumeData = await ResumeAnalysis.findOne({ userEmail });
      if (resumeData && resumeData.resumeText) {
        console.log(`[Autofill] Profile not found. Automatic extraction triggered for ${userEmail}...`);
        const parsed = await parseProfileFromResume(resumeData.resumeText);
        const user = await User.findOne({ email: userEmail });
        const fallbackName = user ? `${user.firstName} ${user.lastName}` : '';
        const fallbackPhone = user ? user.phone : '';

        profile = await CandidateProfile.create({
          userEmail,
          name: parsed.name || fallbackName,
          email: parsed.email || userEmail,
          phone: parsed.phone || fallbackPhone,
          linkedinUrl: parsed.linkedinUrl || '',
          githubUrl: parsed.githubUrl || '',
          portfolioUrl: parsed.portfolioUrl || '',
          skills: parsed.skills || [],
          education: parsed.education || [],
          experience: parsed.experience || [],
          projects: parsed.projects || [],
          certifications: parsed.certifications || [],
          achievements: parsed.achievements || [],
          resumeText: resumeData.resumeText,
          resumeUrl: resumeData.resumeUrl || (user ? user.resume : '')
        });
      } else {
        // Prefill basic profile shell
        profile = await CandidateProfile.create(await getPrefilledProfile(userEmail));
      }
    }

    console.log(`[Autofill] Generating answers for job: ${job.title} at ${job.company}...`);
    const answersData = await generateAutofillAnswers(profile, job);
    
    console.log(`[Autofill] Generating cover letter...`);
    const coverLetterData = await generateCoverLetter(profile, job);
    
    console.log(`[Autofill] Running recruiter AI review...`);
    const reviewData = await generateRecruiterReview(
      profile,
      job,
      answersData.answers,
      coverLetterData.coverLetter
    );

    // Check if an application draft already exists for this jobId and userEmail
    let app = await PreparedApplication.findOne({ userEmail, jobId: job.jobId });
    
    const appData = {
      userEmail,
      jobId: job.jobId,
      jobInfo: {
        title: job.title,
        company: job.company,
        location: job.location || 'Remote',
        employmentType: job.employmentType || 'Full-time',
        description: job.description || '',
        applyLink: job.applyLink || '',
        salaryMin: job.salaryMin || null,
        salaryMax: job.salaryMax || null,
        salaryCurrency: job.salaryCurrency || 'USD'
      },
      candidateProfileSnapshot: profile.toObject(),
      answers: answersData.answers || [],
      coverLetter: coverLetterData.coverLetter || '',
      recruiterReview: reviewData || {
        predictedReaction: 'No analysis conducted.',
        interviewProbability: 'Medium',
        matchScore: 50,
        keyStrengths: [],
        potentialRedFlags: []
      },
      status: 'Draft'
    };

    if (app) {
      app = await PreparedApplication.findByIdAndUpdate(app._id, { $set: appData }, { new: true });
    } else {
      app = await PreparedApplication.create(appData);
    }

    res.status(201).json(app);
  } catch (error) {
    console.error('Autofill generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to prepare application.' });
  }
});

// 5. GET Application History
router.get('/history/:email', async (req, res) => {
  try {
    const history = await PreparedApplication.find({ userEmail: req.params.email })
      .sort({ updatedAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. GET Specific Prepared Application
router.get('/:id', async (req, res) => {
  try {
    const app = await PreparedApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Prepared application not found.' });
    res.json(app);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. PUT Update Prepared Application
router.put('/:id', async (req, res) => {
  try {
    const app = await PreparedApplication.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(app);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8. POST Regenerate Application Answer or Cover Letter
router.post('/:id/regenerate', async (req, res) => {
  try {
    const { type, questionIndex, fieldKey } = req.body;
    const app = await PreparedApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found.' });

    const profile = app.candidateProfileSnapshot;
    const job = app.jobInfo;

    if (type === 'cover_letter') {
      console.log(`[Autofill] Regenerating cover letter for app ${app._id}...`);
      const regenerated = await generateCoverLetter(profile, job);
      const generatedLetter = regenerated.coverLetter || regenerated.coverletter || regenerated.CoverLetter;
      if (!generatedLetter) {
        throw new Error('Groq did not return a valid cover letter in JSON format.');
      }
      app.coverLetter = generatedLetter;
      await app.save();
      return res.json(app);
    } 
    
    if (type === 'answer' && fieldKey) {
      console.log(`[Autofill] Regenerating answer for field: ${fieldKey}...`);
      
      const systemPrompt = `You are an AI job application assistant.
Regenerate a tailored, professional response for the specific screening question based on the candidate's profile and the job description.
Return ONLY valid JSON:
{
  "question": "The question label",
  "answer": "Tailored response (1-2 paragraphs)",
  "confidenceScore": number (0-100),
  "explanation": "Brief explanation referencing the resume content used",
  "fieldKey": "${fieldKey}"
}`;

      const targetQ = app.answers.find(a => a.fieldKey === fieldKey);
      const questionText = targetQ ? targetQ.question : 'Tell us about your background and how it matches this position';

      const userPrompt = `
CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${(job.description || '').slice(0, 4000)}

SCREENING QUESTION TO ANSWER:
"${questionText}"
      `.trim();

      const result = await chatJson(systemPrompt, userPrompt, FAST_MODEL, 0.45);
      const generatedAnswer = result.answer || result.Answer || result.response || result.Response;
      
      if (!generatedAnswer) {
        throw new Error('Groq did not return a valid answer text. Please try again.');
      }
      
      const matchIdx = app.answers.findIndex(a => a.fieldKey === fieldKey);
      if (matchIdx !== -1) {
        app.answers[matchIdx] = {
          ...app.answers[matchIdx].toObject(),
          answer: generatedAnswer,
          confidenceScore: result.confidenceScore || result.confidence || 85,
          explanation: result.explanation || result.reason || 'Regenerated using details from resume.'
        };
      } else {
        app.answers.push({
          question: questionText,
          answer: generatedAnswer,
          confidenceScore: result.confidenceScore || result.confidence || 85,
          explanation: result.explanation || result.reason || 'Regenerated using details from resume.',
          fieldKey
        });
      }

      // Re-run recruiter AI review to align with updated answers (non-blocking try-catch)
      try {
        const updatedReview = await generateRecruiterReview(profile, job, app.answers, app.coverLetter || '');
        app.recruiterReview = updatedReview;
      } catch (reviewError) {
        console.error('[Autofill] Failed to update recruiter review during answer regeneration:', reviewError);
      }

      await app.save();
      return res.json(app);
    }

    res.status(400).json({ message: 'Invalid regeneration request parameters.' });
  } catch (error) {
    console.error('Answer regeneration error:', error);
    res.status(500).json({ message: error.message || 'Failed to regenerate content.' });
  }
});

// 9. POST Detect Form Fields (Playwright scanner)
router.post('/detect-fields', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required.' });
    
    const result = await detectFormFields(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
