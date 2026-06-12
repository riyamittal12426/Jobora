import mongoose from 'mongoose';

const automationLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ['info', 'warn', 'error', 'success'], default: 'info' },
  message: { type: String, required: true }
}, { _id: false });

const detectedFieldSchema = new mongoose.Schema({
  selector: { type: String },
  id: { type: String },
  name: { type: String },
  type: { type: String },
  label: { type: String },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  mappedKey: { type: String },
  mappedValue: { type: String },
  confidence: { type: Number, default: 0 }
}, { _id: false });

const generatedAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  confidenceScore: { type: Number, default: 85 },
  explanation: { type: String },
  cached: { type: Boolean, default: false }
}, { _id: false });

const jobEntrySchema = new mongoose.Schema({
  jobId: { type: String, required: true },
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
  preparedApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparedApplication' },
  status: {
    type: String,
    enum: [
      'PENDING', 'STARTING', 'OPENING_APPLICATION', 'DETECTING_FIELDS', 'MAPPING_FIELDS',
      'UPLOADING_RESUME', 'GENERATING_ANSWERS', 'FILLING_FORM', 'CAPTCHA_REQUIRED',
      'USER_VERIFIED', 'REVIEW_REQUIRED', 'SUBMITTING', 'SUBMITTED', 'FAILED', 'skipped',
      'queued', 'detecting', 'filling', 'uploading', 'generating_answers', 'awaiting_approval', 'approved', 'captcha_detected'
    ],
    default: 'PENDING'
  },
  platform: {
    type: String,
    enum: ['greenhouse', 'lever', 'wellfound', 'ycjobs', 'generic'],
    default: 'generic'
  },
  detectedFields: [detectedFieldSchema],
  generatedAnswers: [generatedAnswerSchema],
  screenshots: {
    preSubmission: { type: String },
    postSubmission: { type: String },
    error: { type: String }
  },
  videoPath: { type: String },
  captchaCheckedAt: { type: Date },
  automationLog: [automationLogSchema],
  errorDetails: {
    type: { type: String },
    message: { type: String },
    recoverable: { type: Boolean, default: true }
  },
  submissionResult: {
    success: { type: Boolean },
    timestamp: { type: Date },
    confirmationUrl: { type: String }
  },
  matchScore: { type: Number },
  applyReadinessScore: { type: Number },
  startedAt: { type: Date },
  completedAt: { type: Date }
});

const automationRunSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['PENDING', 'STARTING', 'running', 'paused', 'completed', 'cancelled', 'failed', 'PARTIALLY_COMPLETED', 'queued'],
    default: 'PENDING'
  },
  jobs: [jobEntrySchema],
  progress: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    currentIndex: { type: Number, default: -1 }
  },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

const AutomationRun = mongoose.model('AutomationRun', automationRunSchema);
export default AutomationRun;
