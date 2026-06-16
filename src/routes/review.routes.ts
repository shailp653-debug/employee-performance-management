import { Router } from 'express';
import { createReview, getReceivedReviews, getGivenReviews, getAllReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roleCheck';

const router = Router();

// Apply auth to all routes
router.use(authenticate);

// Get reviews received by current logged-in employee
router.get('/received', getReceivedReviews);

// Get reviews written by current logged-in reviewer (Manager/Admin)
router.get('/given', checkRole(['ADMIN', 'MANAGER']), getGivenReviews);

// Create a review (Manager/Admin only)
router.post('/', checkRole(['ADMIN', 'MANAGER']), createReview);

// Get all reviews (Admin only)
router.get('/', checkRole(['ADMIN']), getAllReviews);

export default router;
