import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear existing database entries in reverse dependency order
  console.log('Clearing existing records...');
  await prisma.performanceReview.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 3. Create Administrator
  console.log('Seeding Users...');
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Admin',
      email: 'admin@company.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      department: 'Operations',
      designation: 'IT Administrator',
      joiningDate: new Date('2025-01-15'),
      contactNumber: '+1 (555) 019-2834',
    },
  });

  // 4. Create Manager (managed by Admin)
  const manager = await prisma.user.create({
    data: {
      name: 'Michael Manager',
      email: 'manager@company.com',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      department: 'Engineering',
      designation: 'Engineering Manager',
      joiningDate: new Date('2025-06-01'),
      managerId: admin.id,
      contactNumber: '+1 (555) 014-9821',
    },
  });

  // 5. Create Employees (managed by Manager)
  const employee1 = await prisma.user.create({
    data: {
      name: 'Emma Employee',
      email: 'employee@company.com',
      passwordHash: defaultPasswordHash,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Software Engineer',
      joiningDate: new Date('2025-08-12'),
      managerId: manager.id,
      contactNumber: '+1 (555) 017-4562',
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Alex Staff',
      email: 'alex@company.com',
      passwordHash: defaultPasswordHash,
      role: 'EMPLOYEE',
      department: 'Engineering',
      designation: 'Frontend Engineer',
      joiningDate: new Date('2025-09-01'),
      managerId: manager.id,
      contactNumber: '+1 (555) 012-3489',
    },
  });

  console.log(`Created users: 1 Admin, 1 Manager, 2 Employees`);

  // 6. Create Projects
  console.log('Seeding Projects...');
  const project1 = await prisma.project.create({
    data: {
      name: 'PerformX Dashboard',
      description: 'Foundational UI and APIs for the employee evaluation portal.',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-07-31'),
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      managerId: manager.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Database Migration',
      description: 'Migrating legacy performance tables to highly normalized PostgreSQL structures.',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      managerId: manager.id,
    },
  });

  // 7. Assign Project Members
  console.log('Assigning Project Members...');
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: employee1.id },
      { projectId: project1.id, userId: employee2.id },
      { projectId: project2.id, userId: employee1.id },
    ],
  });

  // 8. Seed Attendance Logs (Emma & Alex: 5 days of history)
  console.log('Seeding Attendance Records...');
  const days = [
    { offset: 4, checkInHour: 9, checkInMinute: 0, status: 'PRESENT' },  // 4 days ago
    { offset: 3, checkInHour: 9, checkInMinute: 10, status: 'PRESENT' }, // 3 days ago
    { offset: 2, checkInHour: 9, checkInMinute: 30, status: 'LATE' },    // 2 days ago
    { offset: 1, checkInHour: 9, checkInMinute: 5, status: 'PRESENT' },  // 1 day ago
  ] as const;

  for (const day of days) {
    const logDate = new Date();
    logDate.setDate(logDate.getDate() - day.offset);
    logDate.setUTCHours(0, 0, 0, 0);

    const checkInTime = new Date(logDate);
    checkInTime.setHours(day.checkInHour, day.checkInMinute, 0);

    const checkOutTime = new Date(logDate);
    checkOutTime.setHours(17, 30, 0);

    await prisma.attendance.create({
      data: {
        employeeId: employee1.id,
        date: logDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: day.status,
      },
    });

    await prisma.attendance.create({
      data: {
        employeeId: employee2.id,
        date: logDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: day.status,
      },
    });
  }

  // 9. Seed Performance Reviews
  console.log('Seeding Performance Reviews...');
  await prisma.performanceReview.create({
    data: {
      employeeId: employee1.id,
      reviewerId: manager.id,
      technicalSkills: 4,
      communication: 5,
      teamwork: 4,
      problemSolving: 4,
      leadership: 3,
      comments: 'Emma has shown great progress on the PerformX frontend features. Her communication is outstanding and she is a highly proactive collaborator.',
    },
  });

  await prisma.performanceReview.create({
    data: {
      employeeId: employee2.id,
      reviewerId: manager.id,
      technicalSkills: 3,
      communication: 4,
      teamwork: 5,
      problemSolving: 3,
      leadership: 4,
      comments: 'Alex is an excellent team player and very cooperative. He is highly receptive to feedback. Needs to focus slightly more on backend system architecture.',
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
