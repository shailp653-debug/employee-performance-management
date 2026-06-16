import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Create a performance review
 * POST /api/reviews
 */
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const reviewerId = req.user.id;
    const {
      employeeId,
      technicalSkills,
      communication,
      teamwork,
      problemSolving,
      leadership,
      comments,
    } = req.body;

    // Validation
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID is required.' });
      return;
    }

    const ratings = [technicalSkills, communication, teamwork, problemSolving, leadership];
    for (const r of ratings) {
      if (r === undefined || r === null) {
        res.status(400).json({ success: false, message: 'All skill scores (1-5) are required.' });
        return;
      }
      const score = Number(r);
      if (isNaN(score) || score < 1 || score > 5) {
        res.status(400).json({ success: false, message: 'Skill scores must be integers between 1 and 5.' });
        return;
      }
    }

    // Verify employee exists
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(400).json({ success: false, message: 'Employee does not exist.' });
      return;
    }

    // Optional: verification that reviewer is the manager of the employee (unless they are ADMIN)
    if (req.user.role === 'MANAGER' && employee.managerId !== reviewerId) {
      res.status(403).json({ success: false, message: 'Forbidden. You can only review your own subordinates.' });
      return;
    }

    const review = await prisma.performanceReview.create({
      data: {
        employeeId,
        reviewerId,
        technicalSkills: Number(technicalSkills),
        communication: Number(communication),
        teamwork: Number(teamwork),
        problemSolving: Number(problemSolving),
        leadership: Number(leadership),
        comments: comments || null,
      },
    });

    res.status(201).json({ success: true, message: 'Performance review submitted successfully.', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Internal server error creating review.' });
  }
};

/**
 * Get reviews received by current logged-in user
 * GET /api/reviews/received
 */
export const getReceivedReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const employeeId = req.user.id;

    const reviews = await prisma.performanceReview.findMany({
      where: { employeeId },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true, designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching received reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching received reviews.' });
  }
};

/**
 * Get reviews written/given by current user
 * GET /api/reviews/given
 */
export const getGivenReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const reviewerId = req.user.id;

    const reviews = await prisma.performanceReview.findMany({
      where: { reviewerId },
      include: {
        employee: {
          select: { id: true, name: true, email: true, designation: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching given reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching given reviews.' });
  }
};

/**
 * Get all reviews (Admin only)
 * GET /api/reviews
 */
export const getAllReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.performanceReview.findMany({
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true, designation: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true, designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching all reviews.' });
  }
};
