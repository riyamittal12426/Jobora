import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  event: { type: String, required: true },
  details: { type: String }
}, { _id: false });

const submittedApplicationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  jobId: { type: String, required: true },
  automationRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationRun' },
  jobInfo: {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    employmentType: { type: String },
    description: { type: String },
    applyLink: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryCurrency: { type: String }
  },
  submissionDate: { type: Date, default: Date.now },
  applicationUrl: { type: String },
  confirmationScreenshot: { type: String },
  resumeVersionUrl: { type: String },
  coverLetterText: { type: String },
  generatedAnswers: [{
    question: { type: String },
    answer: { type: String },
    confidenceScore: { type: Number }
  }],
  matchScore: { type: Number },
  applyReadinessScore: { type: Number },
  interviewProbability: { type: String, enum: ['High', 'Medium', 'Low'] },
  aiPrediction: {
    interviewProbability: { type: Number },
    shortlistingProbability: { type: Number },
    resumeStrengthAnalysis: { type: String },
    strongestSellingPoints: [{ type: String }],
    biggestWeaknesses: [{ type: String }],
    suggestedFollowUpActions: [{ type: String }],
    applySuccessPredictionScore: { type: Number },
    recruiterComment: { type: String }
  },
  status: {
    type: String,
    enum: ['submitted', 'interviewing', 'rejected', 'offer', 'withdrawn', 'no_response'],
    default: 'submitted'
  },
  followUpNotes: { type: String },
  timeline: [timelineEventSchema]
}, { timestamps: true });

submittedApplicationSchema.index({ userEmail: 1, submissionDate: -1 });

const SubmittedApplication = mongoose.model('SubmittedApplication', submittedApplicationSchema);
export default SubmittedApplication;
