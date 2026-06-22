import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String },
  linkedinUrl: { type: String },
  status: { 
    type: String, 
    enum: ['To Contact', 'Contacted', 'In Discussion', 'Referral Granted', 'Cold'], 
    default: 'To Contact' 
  },
  lastContactDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
