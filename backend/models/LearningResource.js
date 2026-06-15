import mongoose from 'mongoose';

const resourceLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  snippet: { type: String }
});

const learningResourceSchema = new mongoose.Schema({
  skill: { type: String, required: true, unique: true, index: true },
  officialDocumentation: [resourceLinkSchema],
  freeCourses: [resourceLinkSchema],
  youtubeTutorials: [resourceLinkSchema],
  practiceLabs: [resourceLinkSchema],
  projects: [resourceLinkSchema],
  certifications: [resourceLinkSchema],
  interviewPrep: [resourceLinkSchema]
}, { timestamps: true });

const LearningResource = mongoose.model('LearningResource', learningResourceSchema);
export default LearningResource;
