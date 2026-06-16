import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

/**
 * List all users with query filters
 * GET /api/users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, department, search } = req.query;

    const whereClause: any = {};

    if (role) {
      whereClause.role = role;
    }
    if (department) {
      whereClause.department = department;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        joiningDate: true,
        contactNumber: true,
        profilePicture: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching users.' });
  }
};

/**
 * Create a new user (Admin Only)
 * POST /api/users
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      designation,
      managerId,
      contactNumber,
      profilePicture,
    } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password and role are required.' });
      return;
    }

    // Check if email taken
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        department: department || null,
        designation: designation || null,
        managerId: managerId || null,
        contactNumber: contactNumber || null,
        profilePicture: profilePicture || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error creating user.' });
  }
};

/**
 * Update user details (Admin Only)
 * PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      department,
      designation,
      managerId,
      contactNumber,
      profilePicture,
      password, // Optional update password
    } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const data: any = {
      name,
      email: email ? email.toLowerCase() : undefined,
      role,
      department: department || null,
      designation: designation || null,
      managerId: managerId || null,
      contactNumber: contactNumber || null,
      profilePicture: profilePicture || null,
    };

    if (password && password.trim() !== '') {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    // Check email unique if changed
    if (email && email.toLowerCase() !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        res.status(400).json({ success: false, message: 'Email already in use.' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department,
        designation: updated.designation,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error updating user.' });
  }
};

/**
 * Delete a user (Admin Only)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Check if the user has subordinates; if so, clear their manager ID first or reject deletion
    await prisma.user.updateMany({
      where: { managerId: id },
      data: { managerId: null },
    });

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error deleting user.' });
  }
};

/**
 * List all potential managers (MANAGER and ADMIN roles)
 * GET /api/users/managers
 */
export const getManagers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGER', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, managers });
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching managers.' });
  }
};

/**
 * List subordinates of current logged-in manager
 * GET /api/users/subordinates
 */
export const getSubordinates = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const subordinates = await prisma.user.findMany({
      where: {
        managerId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        joiningDate: true,
        profilePicture: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, subordinates });
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching subordinates.' });
  }
};
