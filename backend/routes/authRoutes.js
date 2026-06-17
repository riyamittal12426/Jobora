import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { syncUser, getProfile, updateProfile } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/sync — Sync Firebase user to MongoDB (called after login/signup)
router.post('/sync', verifyFirebaseToken, syncUser);

// GET /api/auth/profile — Get authenticated user's profile
router.get('/profile', verifyFirebaseToken, getProfile);

// PUT /api/auth/profile — Update authenticated user's profile
router.put('/profile', verifyFirebaseToken, updateProfile);

export default router;
