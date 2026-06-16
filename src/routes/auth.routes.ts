import { Router } from 'express';
import { signup, login, forgotPassword } from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset link
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

export default router;
