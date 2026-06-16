import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  FolderGit2,
  PieChart,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  Award,
  Star,
  User,
  ShieldCheck,
  UserCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'projects' | 'attendance' | 'performance' | 'reports'>('overview');

  // Unified Dashboard Stats from API
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Common Lists
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [subordinates, setSubordinates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);

  // Search/Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Modals & Action States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubordinateId, setSelectedSubordinateId] = useState<string | null>(null);

  // Form Fields
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    designation: '',
    managerId: '',
    contactNumber: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    managerId: ''
  });

  const [reviewForm, setReviewForm] = useState({
    technicalSkills: 5,
    communication: 5,
    teamwork: 5,
    problemSolving: 5,
    leadership: 5,
    comments: ''
  });

  const [assignMemberId, setAssignMemberId] = useState('');

  // Status Alerts
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Trigger Notification
  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/api/reports/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Tab Specific Data
  const fetchData = async () => {
    if (!user) return;
    try {
      if (activeTab === 'overview') {
        fetchStats();
        // Get today's attendance status
        const attRes = await api.get('/api/attendance/today');
        if (attRes.data.success) {
          setAttendanceToday(attRes.data.attendance);
        }
      }

      if (activeTab === 'employees') {
        if (user.role === 'ADMIN') {
          const res = await api.get('/api/users');
          if (res.data.success) setUsers(res.data.users);
          const mgrRes = await api.get('/api/users/managers');
          if (mgrRes.data.success) setManagers(mgrRes.data.managers);
        } else if (user.role === 'MANAGER') {
          const res = await api.get('/api/users/subordinates');
          if (res.data.success) setSubordinates(res.data.subordinates);
        }
      }

      if (activeTab === 'projects') {
        const res = await api.get('/api/projects');
        if (res.data.success) setProjects(res.data.projects);

        if (user.role === 'ADMIN' || user.role === 'MANAGER') {
          // fetch managers list to assign projects
          const mgrRes = await api.get('/api/users/managers');
          if (mgrRes.data.success) setManagers(mgrRes.data.managers);
          
          // fetch all users to assign members
          const userRes = await api.get('/api/users');
          if (userRes.data.success) setUsers(userRes.data.users);
        }
      }

      if (activeTab === 'attendance') {
        const res = await api.get('/api/attendance/history');
        if (res.data.success) setAttendanceHistory(res.data.history);

        const attRes = await api.get('/api/attendance/today');
        if (attRes.data.success) {
          setAttendanceToday(attRes.data.attendance);
        }
      }

      if (activeTab === 'performance') {
        if (user.role === 'ADMIN') {
          const res = await api.get('/api/reviews');
          if (res.data.success) setAllReviews(res.data.reviews);
        } else if (user.role === 'MANAGER') {
          const givRes = await api.get('/api/reviews/given');
          if (givRes.data.success) setReviewsGiven(givRes.data.reviews);
          const subRes = await api.get('/api/users/subordinates');
          if (subRes.data.success) setSubordinates(subRes.data.subordinates);
        } else {
          const recRes = await api.get('/api/reviews/received');
          if (recRes.data.success) setReviewsReceived(recRes.data.reviews);
        }
      }

      if (activeTab === 'reports') {
        fetchStats();
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Attendance Operations ---
  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/api/attendance/check-in');
      if (res.data.success) {
        setAttendanceToday(res.data.attendance);
        triggerNotification('success', 'Successfully checked in for today!');
        fetchStats();
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/api/attendance/check-out');
      if (res.data.success) {
        setAttendanceToday(res.data.attendance);
        triggerNotification('success', 'Successfully checked out. Have a great evening!');
        fetchStats();
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- User CRUD Operations ---
  const handleOpenUserModal = (editUser: any = null) => {
    if (editUser) {
      setEditingUser(editUser);
      setUserForm({
        name: editUser.name,
        email: editUser.email,
        password: '', // blank password unless changing
        role: editUser.role,
        department: editUser.department || '',
        designation: editUser.designation || '',
        managerId: editUser.managerId || '',
        contactNumber: editUser.contactNumber || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        department: '',
        designation: '',
        managerId: '',
        contactNumber: ''
      });
    }
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = { ...userForm };
      // Delete blank fields
      if (!payload.password) delete (payload as any).password;
      if (!payload.managerId) delete (payload as any).managerId;

      if (editingUser) {
        const res = await api.put(`/api/users/${editingUser.id}`, payload);
        if (res.data.success) {
          triggerNotification('success', 'User updated successfully.');
          setUserModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/api/users', payload);
        if (res.data.success) {
          triggerNotification('success', 'User created successfully.');
          setUserModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/api/users/${id}`);
      if (res.data.success) {
        triggerNotification('success', 'User deleted successfully.');
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Deletion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Project Operations ---
  const handleOpenProjectModal = (editProj: any = null) => {
    if (editProj) {
      setEditingProject(editProj);
      setProjectForm({
        name: editProj.name,
        description: editProj.description || '',
        startDate: editProj.startDate ? editProj.startDate.substring(0, 10) : '',
        endDate: editProj.endDate ? editProj.endDate.substring(0, 10) : '',
        status: editProj.status,
        priority: editProj.priority,
        managerId: editProj.managerId
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        name: '',
        description: '',
        startDate: new Date().toISOString().substring(0, 10),
        endDate: '',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        managerId: user?.role === 'MANAGER' ? user.id : ''
      });
    }
    setProjectModalOpen(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = { ...projectForm };
      if (!payload.endDate) delete (payload as any).endDate;

      if (editingProject) {
        const res = await api.put(`/api/projects/${editingProject.id}`, payload);
        if (res.data.success) {
          triggerNotification('success', 'Project updated successfully.');
          setProjectModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/api/projects', payload);
        if (res.data.success) {
          triggerNotification('success', 'Project created successfully.');
          setProjectModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProjectDelete = async (id: string) => {
    if (!window.confirm('Delete project? All project memberships will be cleared.')) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/api/projects/${id}`);
      if (res.data.success) {
        triggerNotification('success', 'Project deleted successfully.');
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Deletion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenMemberModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setAssignMemberId('');
    setMemberModalOpen(true);
  };

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !assignMemberId) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/api/projects/${selectedProjectId}/members`, { userId: assignMemberId });
      if (res.data.success) {
        triggerNotification('success', 'Member assigned to project successfully.');
        setMemberModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Assignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (projectId: string, userId: string) => {
    if (!window.confirm('Remove member from this project?')) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/api/projects/${projectId}/members/${userId}`);
      if (res.data.success) {
        triggerNotification('success', 'Member removed successfully.');
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Review Operations ---
  const handleOpenReviewModal = (employeeId: string) => {
    setSelectedSubordinateId(employeeId);
    setReviewForm({
      technicalSkills: 5,
      communication: 5,
      teamwork: 5,
      problemSolving: 5,
      leadership: 5,
      comments: ''
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubordinateId) return;
    try {
      setActionLoading(true);
      const res = await api.post('/api/reviews', {
        employeeId: selectedSubordinateId,
        ...reviewForm
      });
      if (res.data.success) {
        triggerNotification('success', 'Performance review submitted successfully!');
        setReviewModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      triggerNotification('error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white">Redirecting to login...</p>
      </div>
    );
  }

  // --- Filtered lists for Admin Directory search ---
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter ? u.role === userRoleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-3 text-primary-500 mb-8">
            <ShieldCheck className="h-8 w-8 text-primary-500 animate-pulse" />
            <span className="font-extrabold text-md tracking-wider uppercase text-white">
              PerformX
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Overview</span>
            </button>

            {user.role !== 'EMPLOYEE' && (
              <button
                onClick={() => setActiveTab('employees')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'employees'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="h-5 w-5" />
                <span>{user.role === 'ADMIN' ? 'Employee Directory' : 'My Subordinates'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'projects'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderGit2 className="h-5 w-5" />
              <span>Project Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'attendance'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'performance'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="h-5 w-5" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === 'reports'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PieChart className="h-5 w-5" />
              <span>Reports</span>
            </button>
          </nav>
        </div>

        {/* User Footbar */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-9 w-9 bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
              <span className="text-xs text-primary-500 font-semibold">{user.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 transition duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white capitalize">
            {activeTab === 'overview' ? 'Dashboard Summary' : activeTab.replace('-', ' ')}
          </h1>
          <div className="text-sm text-slate-400 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Inner Content */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">

          {/* Action Notification Alert */}
          {notification && (
            <div className={`p-4 rounded-xl flex items-start space-x-3 border animate-fade-in ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{notification.message}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Quick Greeting */}
              <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-primary-950/20 border border-slate-800/80 shadow-2xl">
                <h2 className="text-2xl font-extrabold text-white">Hello, {user.name}</h2>
                <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
                  Welcome to the performX system. Track check-ins, oversee tasks, reviews, and manage team scores in one cohesive workflow.
                </p>
              </div>

              {/* Attendance quick-action block for Employee role */}
              {user.role === 'EMPLOYEE' && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-500/15 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-500">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-md">Daily Punch Card</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {attendanceToday 
                          ? `Checked in at ${new Date(attendanceToday.checkIn).toLocaleTimeString()} ${attendanceToday.checkOut ? `• Checked out at ${new Date(attendanceToday.checkOut).toLocaleTimeString()}` : ''}`
                          : 'You have not checked in today.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 shrink-0">
                    <button
                      onClick={handleCheckIn}
                      disabled={!!attendanceToday || actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 font-bold text-sm text-white shadow-lg shadow-primary-500/20 transition duration-150"
                    >
                      Clock In
                    </button>
                    <button
                      onClick={handleCheckOut}
                      disabled={!attendanceToday || !!attendanceToday.checkOut || actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold text-sm text-slate-200 border border-slate-700 transition duration-150"
                    >
                      Clock Out
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Cards Loading */}
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
                  ))}
                </div>
              ) : stats ? (
                /* Stats Grid */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {user.role === 'ADMIN' && (
                    <>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Headcount</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.users.total}</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                          <FolderGit2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Projects</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.projects.total}</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System Attendance</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.attendance.overallRate}%</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                          <Star className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Reviews</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.performance.totalReviews}</h3>
                        </div>
                      </div>
                    </>
                  )}

                  {user.role === 'MANAGER' && (
                    <>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Direct Subordinates</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.subordinates.total}</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                          <FolderGit2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Managed Projects</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.projects.total}</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Subordinate Attendance</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.attendance.teamRate}%</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                          <Star className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Team Reviews Given</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.performance.totalReviews}</h3>
                        </div>
                      </div>
                    </>
                  )}

                  {user.role === 'EMPLOYEE' && (
                    <>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                          <FolderGit2 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Assigned Projects</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.projects.total}</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance Rate</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.attendance.rate}%</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                          <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Punch Card count</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.attendance.total} days</h3>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                          <Star className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reviews Received</p>
                          <h3 className="text-2xl font-bold mt-1 text-white">{stats.performance.totalReviews}</h3>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">No stats returned.</p>
              )}

              {/* Dashboard lists depending on role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Side: Recent Details */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary-500" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="p-4 bg-slate-950 border border-slate-800 hover:border-primary-500/40 hover:bg-slate-900/60 rounded-xl text-left transition duration-150"
                    >
                      <h4 className="font-bold text-sm text-white">Project Hub</h4>
                      <p className="text-xs text-slate-500 mt-1">Review active milestones and tasks</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="p-4 bg-slate-950 border border-slate-800 hover:border-primary-500/40 hover:bg-slate-900/60 rounded-xl text-left transition duration-150"
                    >
                      <h4 className="font-bold text-sm text-white">Attendance Logs</h4>
                      <p className="text-xs text-slate-500 mt-1">Check logs and statistics history</p>
                    </button>
                  </div>
                </div>

                {/* Right Side: Quick Profile */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary-500" />
                    Profile Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-semibold text-slate-400">Department</span>
                      <span className="text-xs font-semibold text-white">{user.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-semibold text-slate-400">Designation</span>
                      <span className="text-xs font-semibold text-white">{user.designation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-xs font-semibold text-slate-400">Join Date</span>
                      <span className="text-xs font-semibold text-white">{user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEE DIRECTORY */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                {/* Search Inputs */}
                {user.role === 'ADMIN' && (
                  <div className="flex flex-1 max-w-md space-x-3">
                    <div className="relative flex-1">
                      <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-slate-500 flex items-center pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>
                )}

                <div className="text-slate-400 text-sm">
                  {user.role === 'ADMIN' ? 'Manage full organization listing' : 'Subordinates under your management'}
                </div>

                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => handleOpenUserModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-xl text-white font-bold text-sm shadow-lg shadow-primary-500/20 transition duration-150"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Employee</span>
                  </button>
                )}
              </div>

              {/* Directory Table */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                      <th className="p-4 font-semibold">User Details</th>
                      <th className="p-4 font-semibold">Department</th>
                      <th className="p-4 font-semibold">Designation</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold">Manager</th>
                      {user.role !== 'EMPLOYEE' && <th className="p-4 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {user.role === 'ADMIN' ? (
                      filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/25 transition">
                            <td className="p-4">
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-300">{u.department || '—'}</td>
                            <td className="p-4 text-sm text-slate-300">{u.designation || '—'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                                u.role === 'ADMIN' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                                u.role === 'MANAGER' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                                'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-300">{u.manager?.name || '—'}</td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenUserModal(u)}
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUserDelete(u.id)}
                                className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                            No employees matching search criteria.
                          </td>
                        </tr>
                      )
                    ) : (
                      // Manager Subordinates List
                      subordinates.length > 0 ? (
                        subordinates.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-800/25 transition">
                            <td className="p-4">
                              <div className="font-bold text-white">{sub.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{sub.email}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-300">{sub.department || '—'}</td>
                            <td className="p-4 text-sm text-slate-300">{sub.designation || '—'}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 uppercase">
                                {sub.role}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-300">{user.name}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenReviewModal(sub.id)}
                                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 rounded-lg text-xs font-bold text-white shadow shadow-primary-500/10 transition"
                              >
                                Rate Subordinate
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                            You have no direct subordinates registered.
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT HUB */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              
              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">Create, monitor, and assign members to active projects.</p>
                {user.role !== 'EMPLOYEE' && (
                  <button
                    onClick={() => handleOpenProjectModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-xl text-white font-bold text-sm shadow shadow-primary-500/20 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Project</span>
                  </button>
                )}
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.length > 0 ? (
                  projects.map((proj) => (
                    <div key={proj.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-white text-lg">{proj.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                            proj.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            proj.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {proj.priority} PRIORITY
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{proj.description || 'No description provided.'}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-850">
                          <div>
                            <span className="font-semibold text-slate-500">Manager:</span> {proj.manager?.name || 'Unassigned'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Status:</span>{' '}
                            <span className="font-bold text-primary-500">{proj.status.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Start Date:</span> {new Date(proj.startDate).toLocaleDateString()}
                          </div>
                          {proj.endDate && (
                            <div>
                              <span className="font-semibold text-slate-500">End Date:</span> {new Date(proj.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Members Sublist */}
                        <div className="pt-3">
                          <span className="text-xs font-bold text-slate-400 block mb-1">Project Members:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {proj.members && proj.members.length > 0 ? (
                              proj.members.map((m: any) => (
                                <div key={m.id} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-[11px] text-slate-300">
                                  <span>{m.user.name}</span>
                                  {user.role !== 'EMPLOYEE' && (
                                    <button
                                      onClick={() => handleRemoveMember(proj.id, m.user.id)}
                                      className="text-slate-500 hover:text-red-400 font-bold ml-1 transition"
                                      title="Remove Member"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500 text-xs italic">No members assigned yet.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Operations */}
                      {user.role !== 'EMPLOYEE' && (
                        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-850">
                          <button
                            onClick={() => handleOpenMemberModal(proj.id)}
                            className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-300 transition"
                          >
                            Assign User
                          </button>
                          <button
                            onClick={() => handleOpenProjectModal(proj)}
                            className="p-2 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleProjectDelete(proj.id)}
                            className="p-2 border border-slate-800 hover:border-red-500/35 rounded-xl text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-12 bg-slate-900 rounded-2xl text-center text-slate-500 border border-slate-800">
                    No projects found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              
              {/* Daily Punch Card for Employee */}
              {user.role === 'EMPLOYEE' && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-500/15 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-500">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-md">Clock In / Out Status</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {attendanceToday 
                          ? `Checked in today at ${new Date(attendanceToday.checkIn).toLocaleTimeString()}`
                          : 'Clock in when your workday begins.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 shrink-0">
                    <button
                      onClick={handleCheckIn}
                      disabled={!!attendanceToday || actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 font-bold text-sm text-white shadow shadow-primary-500/20 transition"
                    >
                      Check-In
                    </button>
                    <button
                      onClick={handleCheckOut}
                      disabled={!attendanceToday || !!attendanceToday.checkOut || actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold text-sm text-slate-200 border border-slate-700 transition"
                    >
                      Check-Out
                    </button>
                  </div>
                </div>
              )}

              <p className="text-slate-400 text-sm">Attendance registry showing check-in/out timestamps and metrics.</p>

              {/* Logs Table */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                      <th className="p-4 font-semibold">Employee</th>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Check In</th>
                      <th className="p-4 font-semibold">Check Out</th>
                      <th className="p-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {attendanceHistory.length > 0 ? (
                      attendanceHistory.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-800/25 transition">
                          <td className="p-4">
                            <div className="font-bold text-white">{att.employee?.name || user.name}</div>
                            <div className="text-xs text-slate-500">{att.employee?.department || user.department || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-300">
                            {new Date(att.date).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-sm text-slate-300">
                            {new Date(att.checkIn).toLocaleTimeString()}
                          </td>
                          <td className="p-4 text-sm text-slate-300">
                            {att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : <span className="text-slate-500 italic">No checkout</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              att.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                          No attendance logs logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PERFORMANCE REVIEWS */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">
                  {user.role === 'EMPLOYEE' ? 'Reviews and feedback reports received from your manager' : 'Manage employee skill metrics reviews'}
                </p>
                {user.role === 'MANAGER' && (
                  <div className="text-xs font-semibold text-slate-400">
                    Use <span className="text-primary-500">Rate Subordinate</span> button in directory to write reviews.
                  </div>
                )}
              </div>

              {/* Reviews Display */}
              <div className="space-y-6">
                
                {/* Employee: Received reviews */}
                {user.role === 'EMPLOYEE' && (
                  reviewsReceived.length > 0 ? (
                    reviewsReceived.map((rev) => (
                      <div key={rev.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-850">
                          <div>
                            <h4 className="font-bold text-white text-md">Performance Evaluation</h4>
                            <span className="text-xs text-slate-500">Reviewed by {rev.reviewer.name} ({rev.reviewer.designation || 'Manager'})</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>

                        {/* Skill Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { name: 'Technical Skills', val: rev.technicalSkills },
                            { name: 'Communication', val: rev.communication },
                            { name: 'Teamwork', val: rev.teamwork },
                            { name: 'Problem Solving', val: rev.problemSolving },
                            { name: 'Leadership', val: rev.leadership },
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">{item.name}</span>
                              <div className="flex justify-center items-center text-amber-400 font-black text-lg">
                                {item.val} <span className="text-[10px] text-slate-500 font-bold ml-1">/5</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Comments */}
                        {rev.comments && (
                          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                            <span className="text-xs font-bold text-slate-500 block mb-1">Reviewer's Comments:</span>
                            <p className="text-xs text-slate-300 italic">"{rev.comments}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500">
                      You have not received any performance evaluations yet.
                    </div>
                  )
                )}

                {/* Manager: Given reviews */}
                {user.role === 'MANAGER' && (
                  reviewsGiven.length > 0 ? (
                    reviewsGiven.map((rev) => (
                      <div key={rev.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-850">
                          <div>
                            <h4 className="font-bold text-white text-md">Evaluation for {rev.employee.name}</h4>
                            <span className="text-xs text-slate-500">{rev.employee.designation || 'Staff'} • {rev.employee.department}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>

                        {/* Skill Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { name: 'Technical Skills', val: rev.technicalSkills },
                            { name: 'Communication', val: rev.communication },
                            { name: 'Teamwork', val: rev.teamwork },
                            { name: 'Problem Solving', val: rev.problemSolving },
                            { name: 'Leadership', val: rev.leadership },
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">{item.name}</span>
                              <div className="flex justify-center items-center text-amber-400 font-black text-lg">
                                {item.val} <span className="text-[10px] text-slate-500 font-bold ml-1">/5</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {rev.comments && (
                          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                            <span className="text-xs font-bold text-slate-500 block mb-1">Your Written Comments:</span>
                            <p className="text-xs text-slate-300 italic">"{rev.comments}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500">
                      You have not written any performance evaluations yet.
                    </div>
                  )
                )}

                {/* Admin: All reviews */}
                {user.role === 'ADMIN' && (
                  allReviews.length > 0 ? (
                    allReviews.map((rev) => (
                      <div key={rev.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-slate-850">
                          <div>
                            <h4 className="font-bold text-white text-md">Evaluation: {rev.employee.name}</h4>
                            <span className="text-xs text-slate-500 font-medium">Reviewed by {rev.reviewer.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>

                        {/* Skill Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { name: 'Technical Skills', val: rev.technicalSkills },
                            { name: 'Communication', val: rev.communication },
                            { name: 'Teamwork', val: rev.teamwork },
                            { name: 'Problem Solving', val: rev.problemSolving },
                            { name: 'Leadership', val: rev.leadership },
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">{item.name}</span>
                              <div className="flex justify-center items-center text-amber-400 font-black text-lg">
                                {item.val} <span className="text-[10px] text-slate-500 font-bold ml-1">/5</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {rev.comments && (
                          <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                            <span className="text-xs font-bold text-slate-500 block mb-1">Review Comments:</span>
                            <p className="text-xs text-slate-300 italic">"{rev.comments}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500">
                      No performance evaluations exist in the database.
                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {/* TAB 6: REPORTS & ANALYTICS */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-fade-in">
              <p className="text-slate-400 text-sm">Visual performance indices, aggregates, and data trends.</p>

              {statsLoading ? (
                <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse"></div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Skill scores bar chart */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
                      Skill Ratings Index
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Technical Skills', val: stats.performance.averages.technicalSkills },
                        { label: 'Communication', val: stats.performance.averages.communication },
                        { label: 'Teamwork', val: stats.performance.averages.teamwork },
                        { label: 'Problem Solving', val: stats.performance.averages.problemSolving },
                        { label: 'Leadership', val: stats.performance.averages.leadership },
                      ].map((item, idx) => {
                        const pct = (item.val / 5) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-300">{item.label}</span>
                              <span className="text-amber-400">{item.val} / 5</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-full"
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attendance Analytics */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center mb-6">
                        <Clock className="h-5 w-5 mr-2 text-primary-500" />
                        Attendance Metric Breakdown
                      </h3>
                      {user.role === 'EMPLOYEE' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="text-sm text-slate-400 font-semibold">Total Punch Cards</span>
                            <span className="text-sm font-bold text-white">{stats.attendance.total} days</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="text-sm text-emerald-400 font-semibold">Present Days (On-time)</span>
                            <span className="text-sm font-bold text-white">{stats.attendance.present}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="text-sm text-amber-400 font-semibold">Late Arrivals</span>
                            <span className="text-sm font-bold text-white">{stats.attendance.late}</span>
                          </div>
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-sm text-red-400 font-semibold">Absent Days</span>
                            <span className="text-sm font-bold text-white">{stats.attendance.absent}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-center py-6">
                          <p className="text-xs text-slate-400">
                            {user.role === 'ADMIN' ? 'All team members combined attendance score index' : 'Direct subordinates average attendance score index'}
                          </p>
                          <div className="text-4xl font-extrabold text-white mt-2">
                            {user.role === 'ADMIN' ? stats.attendance.overallRate : stats.attendance.teamRate}%
                          </div>
                          <span className="text-xs text-emerald-400 font-semibold">Average punch-card compliance</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-850">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <span>Evaluation Rate:</span>
                        <span className="text-white font-bold">{stats.performance.totalReviews} reviews issued</span>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <p className="text-slate-500">Failed to render charts.</p>
              )}
            </div>
          )}

        </div>
      </main>

      {/* --- MODALS SECTION --- */}

      {/* 1. ADMIN USER MODAL */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{editingUser ? 'Edit User Context' : 'Register New User'}</h3>
            <form onSubmit={handleUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold">Password {editingUser && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Department</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Designation</label>
                  <input
                    type="text"
                    value={userForm.designation}
                    onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Manager</label>
                  <select
                    value={userForm.managerId}
                    onChange={(e) => setUserForm({ ...userForm, managerId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No Manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow transition"
                >
                  {actionLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADMIN/MANAGER PROJECT MODAL */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{editingProject ? 'Edit Project Milestones' : 'Create Project'}</h3>
            <form onSubmit={handleProjectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 font-semibold">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">End Date (Optional)</label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Status</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Priority</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              
              {user.role === 'ADMIN' && (
                <div>
                  <label className="block text-xs text-slate-400 font-semibold">Assign Manager</label>
                  <select
                    required
                    value={projectForm.managerId}
                    onChange={(e) => setProjectForm({ ...projectForm, managerId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN MEMBER MODAL */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Assign Member to Project</h3>
            <form onSubmit={handleAssignMember} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Select Employee</label>
                <select
                  required
                  value={assignMemberId}
                  onChange={(e) => setAssignMemberId(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow transition"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PERFORMANCE REVIEW MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Evaluate Subordinate Performance</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              
              {/* Ratings (1-5 sliders) */}
              {[
                { label: 'Technical Skills', key: 'technicalSkills' },
                { label: 'Communication', key: 'communication' },
                { label: 'Teamwork', key: 'teamwork' },
                { label: 'Problem Solving', key: 'problemSolving' },
                { label: 'Leadership', key: 'leadership' },
              ].map((skill, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{skill.label}</span>
                    <span className="text-amber-400 font-bold">{(reviewForm as any)[skill.key]} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={(reviewForm as any)[skill.key]}
                    onChange={(e) => setReviewForm({ ...reviewForm, [skill.key]: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              ))}

              {/* Comments */}
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Feedback Comments</label>
                <textarea
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  placeholder="Provide details on strengths and areas for improvement..."
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow transition"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
