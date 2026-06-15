import mongoose from 'mongoose';

const resourceLinkSchema = new mongoose.Schema({
  title: { type: String },
  url: { type: String },
  snippet: { type: String }
});

const roadmapTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  skill: { type: String },
  estimatedTime: { type: String },
  difficulty: { type: String },
  learningObjectives: [{ type: String }],
  matchScoreImprovement: { type: Number },
  interviewReadinessImprovement: { type: Number },
  salaryImpact: { type: String },
  resources: {
    officialDocumentation: [resourceLinkSchema],
    freeCourses: [resourceLinkSchema],
    youtubeTutorials: [resourceLinkSchema],
    practiceLabs: [resourceLinkSchema],
    projects: [resourceLinkSchema],
    certifications: [resourceLinkSchema],
    interviewPrep: [resourceLinkSchema]
  }
});

const careerRoadmapSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true, index: true },
  targetRole: { type: String, required: true },
  experienceLevel: { type: String },
  currentSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  highPrioritySkills: [{ type: String }],
  milestones: [{
    name: { type: String },
    targetPercentage: { type: Number },
    unlocked: { type: Boolean, default: false },
    earnedAt: { type: Date }
  }],
  plans: {
    immediate: {
      title: { type: String, default: 'Immediate Actions (7 Days)' },
      tasks: [roadmapTaskSchema]
    },
    shortTerm: {
      title: { type: String, default: 'Short-Term Goals (30 Days)' },
      tasks: [roadmapTaskSchema]
    },
    midTerm: {
      title: { type: String, default: 'Mid-Term Goals (60 Days)' },
      tasks: [roadmapTaskSchema]
    },
    longTerm: {
      title: { type: String, default: 'Long-Term Goals (90+ Days)' },
      tasks: [roadmapTaskSchema]
    }
  },
  recommendedProjects: [{
    title: { type: String },
    description: { type: String },
    skillsCovered: [{ type: String }],
    githubIdea: { type: String }
  }],
  certifications: [{
    name: { type: String },
    provider: { type: String },
    difficulty: { type: String }
  }],
  interviewPreparationPlan: {
    weeklyGoals: [{ type: String }],
    monthlyGoals: [{ type: String }],
    resumeImprovementSuggestions: [{ type: String }],
    interviewPrepPlan: [{ type: String }]
  },
  expectedMatchScoreImprovement: { type: Number },
  expectedCareerGrowth: { type: String },
  salaryGrowthPotential: { type: String },
  aiImpactSimulation: {
    currentMetrics: {
      matchScore: { type: Number },
      interviewProbability: { type: Number },
      offerProbability: { type: Number },
      applicationSuccessScore: { type: Number }
    },
    impacts: [{
      skill: { type: String },
      newMatchScore: { type: Number },
      newInterviewProbability: { type: Number },
      newOfferProbability: { type: Number },
      newApplicationSuccessScore: { type: Number }
    }]
  },
  careerProjection: {
    possibleJobRoles: [{ type: String }],
    salaryRanges: [{ type: String }],
    careerOpportunities: { type: String }
  },
  aiMentorSummary: { type: String },
  completedTasks: [{ type: String }],
  currentProgress: { type: Number, default: 0 }
}, { timestamps: true });

const CareerRoadmap = mongoose.model('CareerRoadmap', careerRoadmapSchema);
export default CareerRoadmap;
