import mongoose from 'mongoose';

const jobRecommendationSessionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  candidateProfile: { type: mongoose.Schema.Types.Mixed },
  jobs: [{ job: mongoose.Schema.Types.Mixed, analysis: mongoose.Schema.Types.Mixed }],
  skillGapIntelligence: { type: mongoose.Schema.Types.Mixed },
  careerAdvisor: { type: mongoose.Schema.Types.Mixed },
  applyReadinessDashboard: { type: mongoose.Schema.Types.Mixed },
  analytics: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const JobRecommendationSession = mongoose.model('JobRecommendationSession', jobRecommendationSessionSchema);
export default JobRecommendationSession;
