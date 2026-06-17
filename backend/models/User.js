import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Firebase-specific fields
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  authProvider: {
    type: String,
    enum: ['password', 'google.com', 'unknown'],
    default: 'password',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // Profile fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: { type: String, trim: true },
  photoURL: { type: String },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  age: { type: Number, min: 13, max: 120 },
  address: { type: String, trim: true },
  resume: { type: String }, // URL to stored resume file
}, {
  timestamps: true,
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName || this.email;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
export default User;
