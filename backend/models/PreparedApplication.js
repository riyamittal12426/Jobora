import mongoose from 'mongoose';

const preparedApplicationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  jobId: { type: String, required: true, index: true },
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
  candidateProfileSnapshot: { type: mongoose.Schema.Types.Mixed },
  answers: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    confidenceScore: { type: Number, default: 85 },
    explanation: { type: String },
    fieldKey: { type: String }
  }],
  coverLetter: { type: String },
  recruiterReview: {
    predictedReaction: { type: String },
    interviewProbability: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    matchScore: { type: Number },
    keyStrengths: [{ type: String }],
    potentialRedFlags: [{ type: String }]
  },
  status: { type: String, enum: ['Draft', 'Ready', 'Submitted'], default: 'Draft' }
}, { timestamps: true });

const PreparedApplication = mongoose.model('PreparedApplication', preparedApplicationSchema);
export default PreparedApplication;
