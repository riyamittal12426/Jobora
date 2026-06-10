import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  age: { type: Number },
  address: { type: String },
  resume: { type: String }, // Store filename or AWS S3 format URL
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
