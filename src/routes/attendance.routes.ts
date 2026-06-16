import { Router } from 'express';
import { checkIn, checkOut, getTodayStatus, getAttendanceHistory, getSubordinatesAttendance } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roleCheck';

const router = Router();

// Apply auth to all attendance routes
router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/history', getAttendanceHistory);

// Subordinates specific log (Manager/Admin only)
router.get('/subordinates', checkRole(['ADMIN', 'MANAGER']), getSubordinatesAttendance);

export default router;
