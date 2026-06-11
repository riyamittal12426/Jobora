import mongoose from 'mongoose';

const answerEvaluationSchema = new mongoose.Schema({
  technicalAccuracy: { type: Number, min: 0, max: 10 },
  communicationSkills: { type: Number, min: 0, max: 10 },
  problemSolving: { type: Number, min: 0, max: 10 },
  depthOfKnowledge: { type: Number, min: 0, max: 10 },
  confidenceLevel: { type: Number, min: 0, max: 10 },
  relevance: { type: Number, min: 0, max: 10 },
  internalNotes: { type: String },
}, { _id: false });

const interviewAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  question: { type: String, required: true },
  questionCategory: { type: String },
  focusArea: { type: String },
  answer: { type: String, required: true },
  answeredAt: { type: Date, default: Date.now },
  evaluation: answerEvaluationSchema,
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  settings: {
    questionCount: { type: Number, required: true },
    difficulty: { type: String, required: true },
    interviewType: { type: String, required: true },
    targetRole: { type: String, required: true },
  },
  resumeSnapshot: { type: mongoose.Schema.Types.Mixed },
  questions: [{
    id: String,
    text: String,
    category: String,
    focusArea: String,
    resumeReference: String,
  }],
  answers: [interviewAnswerSchema],
  currentQuestionIndex: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['generating', 'in_progress', 'evaluating', 'completed', 'failed'],
    default: 'generating',
  },
  finalReport: { type: mongoose.Schema.Types.Mixed },
  errorMessage: { type: String },
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
