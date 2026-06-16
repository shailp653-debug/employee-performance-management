import { Router } from 'express';
import { getDashboardStats } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply auth to all routes
router.use(authenticate);

// Get dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

export default router;
