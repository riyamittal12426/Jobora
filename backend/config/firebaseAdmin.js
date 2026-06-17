import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the service account key path from env or fallback
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.resolve(__dirname, '..', '..', 'jobora-40c4f-firebase-adminsdk-fbsvc-ae59ee242e.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (err) {
  console.error('❌ Failed to load Firebase service account key:', err.message);
  console.error('   Ensure the file exists at:', serviceAccountPath);
  process.exit(1);
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
