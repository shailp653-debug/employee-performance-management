# Employee Performance Management System

A full-stack Employee Performance Management System built with Node.js, TypeScript, Prisma, PostgreSQL, and React.

## Features

- User Authentication
- Role-Based Access Control (RBAC)
- Employee Attendance Tracking
- Project Management
- Performance Reviews
- Reporting Dashboard
- Secure API Architecture

## Tech Stack

### Backend
- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL

### Frontend
- React
- TypeScript

## Project Structure

```text
client/
prisma/
src/
```

## Installation

### Clone Repository

```bash
git clone https://github.com/shailp653-debug/employee-performance-management.git
cd employee-performance-management
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

### Run Development Server

```bash
npm run dev
```

## Database Migration

```bash
npx prisma migrate dev
```

## Author

Shailp653-debug

## License

MIT License
