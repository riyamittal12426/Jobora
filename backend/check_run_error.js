import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AutomationRun from './models/AutomationRun.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobtracker';

async function check() {
  console.log('Connecting to:', mongoUri);
  await mongoose.connect(mongoUri);
  
  const runs = await AutomationRun.find().sort({ createdAt: -1 }).limit(1);
  if (runs.length === 0) {
    console.log('No runs found.');
  } else {
    const run = runs[0];
    console.log('Run ID:', run._id);
    console.log('Status:', run.status);
    console.log('Progress:', run.progress);
    console.log('Jobs status:');
    run.jobs.forEach((j, i) => {
      console.log(`\n  Job ${i}: ${j.jobInfo.title} (${j.jobInfo.company})`);
      console.log(`    Status:`, j.status);
      console.log(`    Platform:`, j.platform);
      console.log(`    ErrorDetails:`, j.errorDetails);
      console.log(`    Logs:`);
      j.automationLog.forEach(l => {
        console.log(`      [${l.level}] ${l.message}`);
      });
    });
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
