import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, getManagers, getSubordinates } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roleCheck';

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticate);

// Get managers list (used during signup / employee setup)
router.get('/managers', checkRole(['ADMIN', 'MANAGER']), getManagers);

// Get subordinates of current logged-in manager
router.get('/subordinates', checkRole(['ADMIN', 'MANAGER']), getSubordinates);

// List all users
router.get('/', checkRole(['ADMIN', 'MANAGER']), getUsers);

// CRUD routes - Admin only
router.post('/', checkRole(['ADMIN']), createUser);
router.put('/:id', checkRole(['ADMIN']), updateUser);
router.delete('/:id', checkRole(['ADMIN']), deleteUser);

export default router;
