import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Helper to generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign(
    { id: userId, email, role },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '24h' }
  );
};

/**
 * Register a new user
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role = 'EMPLOYEE',
      managerId,
      department,
      designation,
      joiningDate,
      contactNumber,
      profilePicture
    } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
      return;
    }

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
      return;
    }

    // Verify password complexity (minimum 6 characters)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    // Validate role field
    const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles are: ${validRoles.join(', ')}`
      });
      return;
    }

    // 2. Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
      return;
    }

    // 3. If managerId is provided, verify manager exists and is indeed a manager/admin
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager) {
        res.status(400).json({
          success: false,
          message: 'Specified manager does not exist.'
        });
        return;
      }

      if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
        res.status(400).json({
          success: false,
          message: 'The specified managerId must belong to a user with MANAGER or ADMIN role.'
        });
        return;
      }
    }

    // 4. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
        managerId: managerId || null,
        department: department || null,
        designation: designation || null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        contactNumber: contactNumber || null,
        profilePicture: profilePicture || null
      }
    });

    // 6. Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // 7. Respond
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation,
        joiningDate: newUser.joiningDate,
        contactNumber: newUser.contactNumber,
        profilePicture: newUser.profilePicture,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error in signup controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred during registration.'
    });
  }
};

/**
 * Authenticate a user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error in login controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred during login.'
    });
  }
};

/**
 * Password recovery request (Stub flow with full logging & simulation)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
      return;
    }

    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
      return;
    }

    // Query user in the database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Security practice: Always return a generic success message to prevent email enumeration,
    // but internally execute the flow only if user exists.
    if (user) {
      // Simulate generating a reset token (e.g. UUID)
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password-reset' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' } // Token valid for 1 hour
      );

      // Log the reset email event to simulate the sending service
      console.log(`[PASSWORD RESET SERVICE] simulated email sent to: ${user.email}`);
      console.log(`[PASSWORD RESET LINK] http://localhost:5000/api/auth/reset-password?token=${resetToken}`);
    } else {
      console.log(`[PASSWORD RESET SERVICE] requested email ${email} does not exist in DB.`);
    }

    res.status(200).json({
      success: true,
      message: 'If an account is associated with this email, a password reset link has been dispatched.'
    });
  } catch (error) {
    console.error('Error in forgotPassword controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred during password recovery flow.'
    });
  }
};
