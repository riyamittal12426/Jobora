import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

// Option 1: Load from environment variable (for Render / production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('🔥 Firebase credentials loaded from environment variable');
  } catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
    process.exit(1);
  }
}
// Option 2: Load from file (for local development)
else {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, '..', '..', 'jobora-40c4f-firebase-adminsdk-fbsvc-ae59ee242e.json');

  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log('🔥 Firebase credentials loaded from file');
  } catch (err) {
    console.error('❌ Failed to load Firebase service account key:', err.message);
    console.error('   Ensure the file exists at:', serviceAccountPath);
    process.exit(1);
  }
}

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
  console.log('🔥 Firebase Admin SDK initialized');
}

const admin = {
  auth: () => getAuth(),
};

export default admin;
