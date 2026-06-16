import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Get projects list based on User role
 * GET /api/projects
 */
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id, role } = req.user;
    let projects;

    if (role === 'ADMIN') {
      // Admin sees everything
      projects = await prisma.project.findMany({
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, designation: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'MANAGER') {
      // Manager sees projects they manage
      projects = await prisma.project.findMany({
        where: { managerId: id },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, designation: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Employee sees projects they are member of
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId: id },
          },
        },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, designation: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching projects.' });
  }
};

/**
 * Create a new project (Admin and Manager only)
 * POST /api/projects
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { name, description, startDate, endDate, status, priority, managerId } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Project name is required.' });
      return;
    }

    // Determine managerId
    let targetManagerId = managerId;
    if (req.user.role === 'MANAGER' && !managerId) {
      targetManagerId = req.user.id;
    } else if (!targetManagerId) {
      res.status(400).json({ success: false, message: 'Manager ID is required.' });
      return;
    }

    // Verify manager exists
    const managerExists = await prisma.user.findUnique({ where: { id: targetManagerId } });
    if (!managerExists) {
      res.status(400).json({ success: false, message: 'Designated manager does not exist.' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'NOT_STARTED',
        priority: priority || 'MEDIUM',
        managerId: targetManagerId,
      },
    });

    res.status(201).json({ success: true, message: 'Project created successfully.', project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Internal server error creating project.' });
  }
};

/**
 * Update project details (Admin and Manager only)
 * PUT /api/projects/:id
 */
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;
    const { name, description, startDate, endDate, status, priority, managerId } = req.body;

    // Check project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    // Authorization check: Managers can only update projects they manage
    if (req.user.role === 'MANAGER' && project.managerId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Forbidden. You do not manage this project.' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        status: status || undefined,
        priority: priority || undefined,
        managerId: managerId || undefined,
      },
    });

    res.status(200).json({ success: true, message: 'Project updated successfully.', project: updated });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Internal server error updating project.' });
  }
};

/**
 * Delete project (Admin and Manager only)
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    if (req.user.role === 'MANAGER' && project.managerId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Forbidden. You do not manage this project.' });
      return;
    }

    await prisma.project.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Internal server error deleting project.' });
  }
};

/**
 * Assign user as project member
 * POST /api/projects/:id/members
 */
export const assignProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id: projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required.' });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    if (req.user.role === 'MANAGER' && project.managerId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Forbidden. You do not manage this project.' });
      return;
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      res.status(400).json({ success: false, message: 'Specified user does not exist.' });
      return;
    }

    // Check if already a member
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'User is already a member of this project.' });
      return;
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
      },
    });

    res.status(201).json({ success: true, message: 'Member assigned successfully.', member: newMember });
  } catch (error) {
    console.error('Error assigning member:', error);
    res.status(500).json({ success: false, message: 'Internal server error assigning project member.' });
  }
};

/**
 * Remove user from project member list
 * DELETE /api/projects/:id/members/:userId
 */
export const removeProjectMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id: projectId, userId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    if (req.user.role === 'MANAGER' && project.managerId !== req.user.id) {
      res.status(403).json({ success: false, message: 'Forbidden. You do not manage this project.' });
      return;
    }

    // Check if membership exists
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'User is not a member of this project.' });
      return;
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    res.status(200).json({ success: true, message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, message: 'Internal server error removing project member.' });
  }
};
