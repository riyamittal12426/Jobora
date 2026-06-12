import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  linkedinUrl: { type: String },
  githubUrl: { type: String },
  portfolioUrl: { type: String },
  education: [{
    school: { type: String },
    degree: { type: String },
    fieldOfStudy: { type: String },
    startDate: { type: String },
    endDate: { type: String }
  }],
  skills: [{ type: String }],
  experience: [{
    company: { type: String },
    role: { type: String },
    description: { type: String },
    startDate: { type: String },
    endDate: { type: String }
  }],
  projects: [{
    title: { type: String },
    description: { type: String },
    link: { type: String }
  }],
  certifications: [{ type: String }],
  achievements: [{ type: String }],
  resumeText: { type: String },
  resumeUrl: { type: String }
}, { timestamps: true });

const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);
export default CandidateProfile;
