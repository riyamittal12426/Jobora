import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import ImageKit from 'imagekit';
import multer from 'multer';
import User from './models/User.js';
import Application from './models/Application.js';
import ResumeAnalysis from './models/ResumeAnalysis.js';
import interviewRoutes from './routes/interviewRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import { PDFParse } from 'pdf-parse';

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing JSON bodies

// ImageKit Initialization
const imagekit = new ImageKit({
  publicKey: "public_l6Cq20xKs2RG3i0SpYNqf5coZTI=",
  privateKey: "private_7TSpOUWgxQIbwPKeGHJkbQ253+4=",
  urlEndpoint: "https://ik.imagekit.io/kuvu4dxxv"
});

// Multer Initialization (Store file in memory temporarily)
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error: ', err.message));

// Basic default route
app.get('/', (req, res) => {
  res.send('JobTracker API is running...');
});

// --- USER ROUTES ---
// Register User Profile with ImageKit Resume Upload
app.post('/api/users/profile', upload.single('resume'), async (req, res) => {
  try {
    let resumeUrl = req.body.resume;

    // Check if a file was actually uploaded
    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer, // upload the buffer directly from memory
        fileName: req.file.originalname,
        folder: '/jobtracker_resumes'
      });
      resumeUrl = uploadResponse.url; // Save the ImageKit URL
    }

    const userData = { ...req.body, resume: resumeUrl };
    // Try to find the user by email and update, or create if it doesn't exist
    const savedUser = await User.findOneAndUpdate(
      { email: req.body.email },
      { $set: userData },
      { new: true, upsert: true }
    );
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get User by Email
app.get('/api/users/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- APPLICATION ROUTES ---
app.post('/api/applications', async (req, res) => {
  try {
    const newApp = new Application(req.body);
    const savedApp = await newApp.save();
    res.status(201).json(savedApp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Applications by User Email
app.get('/api/applications/:email', async (req, res) => {
  try {
    const apps = await Application.find({ userEmail: req.params.email }).sort({ dateApplied: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/interview', interviewRoutes);
app.use('/api/jobs', jobRoutes);

async function inferExperienceLevel(text, foundTech) {
  const lower = text.toLowerCase();
  const yearsMatch = lower.match(/(\d+)\+?\s*(years|yrs)/);
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
  if (years >= 5 || foundTech.length >= 8) return 'Senior';
  if (years >= 2 || foundTech.length >= 4) return 'Mid';
  return 'Junior';
}

async function extractTextFromPdf({ buffer, url }) {
  const parser = buffer
    ? new PDFParse({ data: buffer })
    : new PDFParse({ url });

  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
}

// --- RESUME API ROUTES ---
app.post('/api/resume/analyze', upload.single('resume'), async (req, res) => {
  try {
    let fileUrl = req.body.resumeUrl;
    const userEmail = req.body.userEmail;
    let pdfBuffer;

    if (req.file) {
      pdfBuffer = req.file.buffer;
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: '/jobtracker_resumes'
      });
      fileUrl = uploadResponse.url;
    } else if (fileUrl) {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return res.status(400).json({ message: 'Could not fetch resume from ImageKit. Please re-upload your resume.' });
      }
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    if (!pdfBuffer && !fileUrl) {
      return res.status(400).json({ message: 'No resume provided for analysis.' });
    }

    const text = pdfBuffer
      ? await extractTextFromPdf({ buffer: pdfBuffer })
      : await extractTextFromPdf({ url: fileUrl });

    if (!text.trim()) {
      return res.status(400).json({ message: 'No readable text found in the PDF. Use a text-based PDF, not a scanned image.' });
    }
    const lowerText = text.toLowerCase();

    // Perform rule-based analysis on the actual extracted RESUME TEXT
    const technicalKeywords = [
      'javascript', 'react', 'node', 'python', 'java', 'sql', 'aws', 
      'docker', 'typescript', 'html', 'css', 'git', 'c++', 
      'machine learning', 'mongodb', 'express'
    ];
    const foundTech = technicalKeywords.filter(kw => lowerText.includes(kw));
    const missingTech = technicalKeywords.filter(kw => !lowerText.includes(kw)).slice(0, 5);
    
    // Search for standard header structures to determine ATS
    const hasExperience = lowerText.includes('experience') || lowerText.includes('employment') || lowerText.includes('work history');
    const hasEducation = lowerText.includes('education') || lowerText.includes('university') || lowerText.includes('degree');
    const hasProjects = lowerText.includes('project');
    
    // Look for numbers with percentages or K/M (e.g. "improved by 20%", "saved $10k") for impact metrics
    const metricsCount = (text.match(/\d+[%kK\+]/g) || []).length;

    // Calculate dynamic scores strictly based on the resume contents
    const techScore = Math.min(100, 40 + (foundTech.length * 6));
    const expScore = hasExperience ? Math.min(100, 60 + (metricsCount * 12)) : 30;
    const atsScore = 100 - (!hasExperience ? 15 : 0) - (!hasEducation ? 15 : 0);
    const projScore = hasProjects ? 85 : 40;
    const overallScore = Math.round((techScore + expScore + atsScore + projScore) / 4);

    // Generate accurate dynamic feedback lists based on the parsed data
    const strengths = [];
    const weaknesses = [];
    const atsIssues = [];
    const suggestions = [];
    
    if (foundTech.length >= 4) {
      strengths.push(`Strong variety of technical skills discovered (${foundTech.slice(0, 3).join(', ')}, etc.)`);
    } else {
      weaknesses.push('Could include more relevant technical keywords');
    }
    
    if (metricsCount >= 2) {
      strengths.push(`Excellent use of quantifiable metrics (${metricsCount} key metrics found)`);
    } else {
      weaknesses.push('Lack of quantifiable impact metrics found');
      suggestions.push('Add exact numbers to bullet points (e.g., "improved performance by 20%").');
    }

    if (hasExperience) strengths.push('Clear experience section correctly detected');
    else atsIssues.push('Missing explicit "Experience" or "Work History" section title');

    if (!hasEducation) atsIssues.push('Missing "Education" section - ATS may reject this');
    if (hasProjects) strengths.push('Included projects section adequately highlights practical experience');
    if (foundTech.length === 0) suggestions.push('Ensure your skills are explicitly listed rather than just implied within descriptions.');

    const experienceLevel = await inferExperienceLevel(text, foundTech);

    const dynamicAnalysis = {
      overallScore,
      atsScore,
      technicalScore: techScore,
      experienceScore: expScore,
      projectScore: projScore,
      foundSkills: foundTech,
      metricsCount,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      resumeUrl: fileUrl || null,
      resumeText: text,
      experienceLevel,
      strengths,
      weaknesses,
      missingSkills: missingTech,
      suggestions,
      atsIssues,
      resumeSummary: `Parsed ${text.split(/\s+/).filter(Boolean).length} words from your resume. Found ${foundTech.length} technical skill${foundTech.length === 1 ? '' : 's'}${foundTech.length ? ` (${foundTech.slice(0, 4).join(', ')})` : ''} and ${metricsCount} quantifiable metric${metricsCount === 1 ? '' : 's'}. ${overallScore > 75 ? 'Strong foundation for ATS screening.' : 'Consider adding more keywords and measurable outcomes.'}`,
      interviewReadiness: overallScore > 80 ? 'High' : overallScore > 60 ? 'Medium' : 'Needs Work',
      recruiterImpression: foundTech.length > 0
        ? `Resume highlights ${foundTech.slice(0, 3).join(', ')}${foundTech.length > 3 ? ` and ${foundTech.length - 3} more skill${foundTech.length - 3 === 1 ? '' : 's'}` : ''}. ${metricsCount > 0 ? `${metricsCount} impact metric${metricsCount === 1 ? '' : 's'} help demonstrate results.` : 'Add numbers to show the impact of your work.'}`
        : `No common technical keywords detected yet. ${hasExperience ? 'Experience section is present.' : 'Add a clear experience section.'} ${hasEducation ? 'Education is listed.' : 'Include education details.'}`
    };

    if (userEmail) {
      await ResumeAnalysis.findOneAndUpdate(
        { userEmail },
        {
          $set: {
            userEmail,
            resumeUrl: fileUrl || null,
            resumeText: text,
            foundSkills: foundTech,
            strengths,
            weaknesses,
            missingSkills: missingTech,
            suggestions,
            experienceLevel,
            overallScore,
            technicalScore: techScore,
            experienceScore: expScore,
            wordCount: dynamicAnalysis.wordCount,
            metricsCount,
            resumeSummary: dynamicAnalysis.resumeSummary,
            recruiterImpression: dynamicAnalysis.recruiterImpression,
            fullAnalysis: dynamicAnalysis,
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json(dynamicAnalysis);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ message: 'Failed to analyze resume. Please ensure it is a text-based PDF.' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
