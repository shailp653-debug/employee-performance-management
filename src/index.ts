import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import attendanceRoutes from './routes/attendance.routes';
import reviewRoutes from './routes/review.routes';
import reportRoutes from './routes/report.routes';
import { prisma } from './lib/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Simple query to verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Exception:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred on the server.'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server and Prisma connection...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server and Prisma disconnected. Exit.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server and Prisma connection...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server and Prisma disconnected. Exit.');
    process.exit(0);
  });
});

export default app;
