import mongoose from 'mongoose';

const successPredictionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  jobId: { type: String, required: true },
  jobTitle: { type: String },
  company: { type: String },
  location: { type: String },
  jobDescription: { type: String },
  prediction: { type: mongoose.Schema.Types.Mixed, required: true },
  candidateSnapshot: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Create a compound index to quickly find user prediction for specific jobs
successPredictionSchema.index({ userEmail: 1, jobId: 1 }, { unique: true });

const SuccessPrediction = mongoose.model('SuccessPrediction', successPredictionSchema);
export default SuccessPrediction;
