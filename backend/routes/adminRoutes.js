import { Router } from 'express';
import { verifyFirebaseToken, attachDbUser, requireRole } from '../middleware/auth.js';
import { listUsers } from '../controllers/authController.js';

const router = Router();

// All admin routes require: Firebase auth + DB user lookup + admin role
router.use(verifyFirebaseToken, attachDbUser, requireRole('admin'));

// GET /api/admin/users — List all users (admin only)
router.get('/users', listUsers);

export default router;
