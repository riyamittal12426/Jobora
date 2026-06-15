import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Added password field
  phone: { type: String },
  age: { type: Number },
  address: { type: String },
  resume: { type: String }, // Store filename or AWS S3 format URL
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
