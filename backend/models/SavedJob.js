import mongoose from 'mongoose';

const savedJobSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  jobId: { type: String, required: true },
  job: { type: mongoose.Schema.Types.Mixed },
  analysis: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

savedJobSchema.index({ userEmail: 1, jobId: 1 }, { unique: true });

const SavedJob = mongoose.model('SavedJob', savedJobSchema);
export default SavedJob;
