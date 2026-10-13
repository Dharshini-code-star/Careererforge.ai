import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = Router();

const credentialRateLimit = createRateLimit(15 * 60 * 1000, 20);

router.post('/register', credentialRateLimit, registerUser);
router.post('/login', credentialRateLimit, loginUser);
router.get('/me', protect, getMe);

export default router;
