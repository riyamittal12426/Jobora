import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true }, // Linking the app to the user
  company: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, default: 'Applied' },
  locationType: { type: String },
  location: { type: String },
  source: { type: String },
  dateApplied: { type: Date, default: Date.now }
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
