import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Helper to get UTC date (ignoring time) for database mapping
const getTodayDate = (): Date => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Check-in for today
 * POST /api/attendance/check-in
 */
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const employeeId = req.user.id;
    const todayDate = getTodayDate();
    const checkInTime = new Date();

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: todayDate,
        },
      },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'You have already checked in today.' });
      return;
    }

    // Determine status (LATE if check-in is after 09:15 AM local time)
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    let status: 'PRESENT' | 'LATE' = 'PRESENT';

    if (hours > 9 || (hours === 9 && minutes > 15)) {
      status = 'LATE';
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: todayDate,
        checkIn: checkInTime,
        status,
      },
    });

    res.status(201).json({ success: true, message: 'Checked in successfully.', attendance });
  } catch (error) {
    console.error('Error in check-in:', error);
    res.status(500).json({ success: false, message: 'Internal server error during check-in.' });
  }
};

/**
 * Check-out for today
 * POST /api/attendance/check-out
 */
export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const employeeId = req.user.id;
    const todayDate = getTodayDate();
    const checkOutTime = new Date();

    // Find today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: todayDate,
        },
      },
    });

    if (!attendance) {
      res.status(400).json({ success: false, message: 'You must check in before checking out.' });
      return;
    }

    if (attendance.checkOut) {
      res.status(400).json({ success: false, message: 'You have already checked out today.' });
      return;
    }

    const updated = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOut: checkOutTime,
      },
    });

    res.status(200).json({ success: true, message: 'Checked out successfully.', attendance: updated });
  } catch (error) {
    console.error('Error in check-out:', error);
    res.status(500).json({ success: false, message: 'Internal server error during check-out.' });
  }
};

/**
 * Get today's attendance status
 * GET /api/attendance/today
 */
export const getTodayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const employeeId = req.user.id;
    const todayDate = getTodayDate();

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: todayDate,
        },
      },
    });

    res.status(200).json({ success: true, checkedIn: !!attendance, attendance });
  } catch (error) {
    console.error('Error fetching today status:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching today status.' });
  }
};

/**
 * Get attendance history based on user role context
 * GET /api/attendance/history
 */
export const getAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id, role } = req.user;
    let history;

    if (role === 'ADMIN') {
      history = await prisma.attendance.findMany({
        include: {
          employee: {
            select: { id: true, name: true, email: true, department: true },
          },
        },
        orderBy: { date: 'desc' },
      });
    } else if (role === 'MANAGER') {
      // Manager sees history of their subordinates plus their own
      history = await prisma.attendance.findMany({
        where: {
          OR: [
            { employeeId: id },
            { employee: { managerId: id } },
          ],
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true, department: true },
          },
        },
        orderBy: { date: 'desc' },
      });
    } else {
      // Employee sees only their own history
      history = await prisma.attendance.findMany({
        where: { employeeId: id },
        orderBy: { date: 'desc' },
      });
    }

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching history.' });
  }
};

/**
 * Get subordinates' attendance history (Manager and Admin only)
 * GET /api/attendance/subordinates
 */
export const getSubordinatesAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id } = req.user;

    const history = await prisma.attendance.findMany({
      where: {
        employee: { managerId: id },
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true, designation: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Error fetching subordinates attendance:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching subordinates attendance.' });
  }
};
