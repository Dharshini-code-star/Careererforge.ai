import { Router } from 'express';
import { updateProfile, getDashboardSummary } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.put('/profile', protect, updateProfile);
router.get('/dashboard', protect, getDashboardSummary);

export default router;
