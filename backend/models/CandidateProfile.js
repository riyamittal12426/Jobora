import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  linkedinUrl: { type: String },
  githubUrl: { type: String },
  portfolioUrl: { type: String },
  personalInfo: {
    fullName: { type: String },
    jobTitle: { type: String },
    location: { type: String },
    email: { type: String },
    phone: { type: String },
    linkedin: { type: String },
    portfolio: { type: String },
    github: { type: String }
  },
  summary: { type: String },
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
    bullets: [{ type: String }],
    startDate: { type: String },
    endDate: { type: String }
  }],
  projects: [{
    title: { type: String },
    description: { type: String },
    bullets: [{ type: String }],
    link: { type: String }
  }],
  certifications: [{ type: String }],
  achievements: [{ type: String }],
  resumeText: { type: String },
  resumeUrl: { type: String },
  dealbreakers: {
    minSalary: { type: Number, default: null },
    remoteOnly: { type: Boolean, default: false },
    noVisaSponsorship: { type: Boolean, default: false },
    noStaffingAgencies: { type: Boolean, default: false }
  }
}, { timestamps: true });

const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);
export default CandidateProfile;
