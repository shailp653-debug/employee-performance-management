import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Get aggregated dashboard statistics based on requesting user's role
 * GET /api/reports/dashboard-stats
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { id, role } = req.user;

    if (role === 'ADMIN') {
      // 1. Admin Stats
      const [
        totalUsers,
        adminCount,
        managerCount,
        employeeCount,
        totalProjects,
        attendanceCounts,
        performanceAverages,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'MANAGER' } }),
        prisma.user.count({ where: { role: 'EMPLOYEE' } }),
        prisma.project.count(),
        prisma.attendance.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.performanceReview.aggregate({
          _avg: {
            technicalSkills: true,
            communication: true,
            teamwork: true,
            problemSolving: true,
            leadership: true,
          },
          _count: { id: true },
        }),
      ]);

      // Calculate attendance rate
      let totalAttendance = 0;
      let presentOrLate = 0;
      attendanceCounts.forEach((group) => {
        const count = group._count.status;
        totalAttendance += count;
        if (group.status === 'PRESENT' || group.status === 'LATE') {
          presentOrLate += count;
        }
      });

      const attendanceRate = totalAttendance > 0 ? Math.round((presentOrLate / totalAttendance) * 100) : 100;

      res.status(200).json({
        success: true,
        stats: {
          users: { total: totalUsers, admins: adminCount, managers: managerCount, employees: employeeCount },
          projects: { total: totalProjects },
          attendance: { overallRate: attendanceRate },
          performance: {
            totalReviews: performanceAverages._count.id,
            averages: {
              technicalSkills: performanceAverages._avg.technicalSkills ? parseFloat(performanceAverages._avg.technicalSkills.toFixed(2)) : 0,
              communication: performanceAverages._avg.communication ? parseFloat(performanceAverages._avg.communication.toFixed(2)) : 0,
              teamwork: performanceAverages._avg.teamwork ? parseFloat(performanceAverages._avg.teamwork.toFixed(2)) : 0,
              problemSolving: performanceAverages._avg.problemSolving ? parseFloat(performanceAverages._avg.problemSolving.toFixed(2)) : 0,
              leadership: performanceAverages._avg.leadership ? parseFloat(performanceAverages._avg.leadership.toFixed(2)) : 0,
            },
          },
        },
      });
      return;
    }

    if (role === 'MANAGER') {
      // 2. Manager Stats
      const [
        subordinateCount,
        managedProjectsCount,
        performanceAverages,
        attendanceCounts,
      ] = await Promise.all([
        prisma.user.count({ where: { managerId: id } }),
        prisma.project.count({ where: { managerId: id } }),
        prisma.performanceReview.aggregate({
          where: {
            employee: { managerId: id },
          },
          _avg: {
            technicalSkills: true,
            communication: true,
            teamwork: true,
            problemSolving: true,
            leadership: true,
          },
          _count: { id: true },
        }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: {
            employee: { managerId: id },
          },
          _count: { status: true },
        }),
      ]);

      // Calculate team attendance rate
      let totalAttendance = 0;
      let presentOrLate = 0;
      attendanceCounts.forEach((group) => {
        const count = group._count.status;
        totalAttendance += count;
        if (group.status === 'PRESENT' || group.status === 'LATE') {
          presentOrLate += count;
        }
      });

      const teamAttendanceRate = totalAttendance > 0 ? Math.round((presentOrLate / totalAttendance) * 100) : 100;

      res.status(200).json({
        success: true,
        stats: {
          subordinates: { total: subordinateCount },
          projects: { total: managedProjectsCount },
          attendance: { teamRate: teamAttendanceRate },
          performance: {
            totalReviews: performanceAverages._count.id,
            averages: {
              technicalSkills: performanceAverages._avg.technicalSkills ? parseFloat(performanceAverages._avg.technicalSkills.toFixed(2)) : 0,
              communication: performanceAverages._avg.communication ? parseFloat(performanceAverages._avg.communication.toFixed(2)) : 0,
              teamwork: performanceAverages._avg.teamwork ? parseFloat(performanceAverages._avg.teamwork.toFixed(2)) : 0,
              problemSolving: performanceAverages._avg.problemSolving ? parseFloat(performanceAverages._avg.problemSolving.toFixed(2)) : 0,
              leadership: performanceAverages._avg.leadership ? parseFloat(performanceAverages._avg.leadership.toFixed(2)) : 0,
            },
          },
        },
      });
      return;
    }

    // 3. Employee Stats
    const [
      projectCount,
      attendanceCounts,
      performanceAverages,
      recentReviews,
    ] = await Promise.all([
      prisma.projectMember.count({ where: { userId: id } }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { employeeId: id },
        _count: { status: true },
      }),
      prisma.performanceReview.aggregate({
        where: { employeeId: id },
        _avg: {
          technicalSkills: true,
          communication: true,
          teamwork: true,
          problemSolving: true,
          leadership: true,
        },
        _count: { id: true },
      }),
      prisma.performanceReview.findMany({
        where: { employeeId: id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { name: true, designation: true },
          },
        },
      }),
    ]);

    let present = 0;
    let late = 0;
    let absent = 0;

    attendanceCounts.forEach((group) => {
      if (group.status === 'PRESENT') present = group._count.status;
      if (group.status === 'LATE') late = group._count.status;
      if (group.status === 'ABSENT') absent = group._count.status;
    });

    const totalDays = present + late + absent;
    const personalAttendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 100;

    res.status(200).json({
      success: true,
      stats: {
        projects: { total: projectCount },
        attendance: {
          rate: personalAttendanceRate,
          present,
          late,
          absent,
          total: totalDays,
        },
        performance: {
          totalReviews: performanceAverages._count.id,
          averages: {
            technicalSkills: performanceAverages._avg.technicalSkills ? parseFloat(performanceAverages._avg.technicalSkills.toFixed(2)) : 0,
            communication: performanceAverages._avg.communication ? parseFloat(performanceAverages._avg.communication.toFixed(2)) : 0,
            teamwork: performanceAverages._avg.teamwork ? parseFloat(performanceAverages._avg.teamwork.toFixed(2)) : 0,
            problemSolving: performanceAverages._avg.problemSolving ? parseFloat(performanceAverages._avg.problemSolving.toFixed(2)) : 0,
            leadership: performanceAverages._avg.leadership ? parseFloat(performanceAverages._avg.leadership.toFixed(2)) : 0,
          },
          recent: recentReviews,
        },
      },
    });
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error calculating stats.' });
  }
};
