import mongoose from 'mongoose';
import crypto from 'crypto';

const answerCacheSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  questionHash: { type: String, required: true, index: true },
  questionText: { type: String, required: true },
  jobTitle: { type: String },
  company: { type: String },
  answer: { type: String, required: true },
  confidenceScore: { type: Number, default: 85 },
  explanation: { type: String },
  usageCount: { type: Number, default: 1 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

// Compound index for efficient lookups
answerCacheSchema.index({ userEmail: 1, questionHash: 1 });
// TTL index: auto-delete expired entries
answerCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Generate a stable hash from a question string for cache keying.
 * Normalizes whitespace, lowercases, and strips punctuation before hashing.
 */
answerCacheSchema.statics.hashQuestion = function (questionText) {
  const normalized = (questionText || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('md5').update(normalized).digest('hex');
};

const AnswerCache = mongoose.model('AnswerCache', answerCacheSchema);
export default AnswerCache;
