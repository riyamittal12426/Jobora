import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  resumeUrl: { type: String },
  resumeText: { type: String },
  foundSkills: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missingSkills: [{ type: String }],
  suggestions: [{ type: String }],
  experienceLevel: { type: String, default: 'Mid' },
  overallScore: { type: Number },
  technicalScore: { type: Number },
  experienceScore: { type: Number },
  wordCount: { type: Number },
  metricsCount: { type: Number },
  resumeSummary: { type: String },
  recruiterImpression: { type: String },
  fullAnalysis: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
