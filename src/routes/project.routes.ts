import { Router } from 'express';
import { getProjects, createProject, updateProject, deleteProject, assignProjectMember, removeProjectMember } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roleCheck';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List projects based on user context
router.get('/', getProjects);

// CRUD routes (Admin / Manager only)
router.post('/', checkRole(['ADMIN', 'MANAGER']), createProject);
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), updateProject);
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), deleteProject);

// Member assignment routes
router.post('/:id/members', checkRole(['ADMIN', 'MANAGER']), assignProjectMember);
router.delete('/:id/members/:userId', checkRole(['ADMIN', 'MANAGER']), removeProjectMember);

export default router;
