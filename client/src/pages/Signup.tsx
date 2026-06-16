import React, { useState } from 'react';
import { useNavigate as routerNavigate, Link as RouterLink } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuth, User } from '../context/AuthContext';
import api from '../lib/api';

export const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = routerNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('EMPLOYEE');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Client-side validation
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setValidationErrors({});

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/signup', {
        name,
        email,
        password,
        role,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
      });

      const { token, user } = response.data as { token: string; user: User };

      // Log in automatically upon registration
      login(token, user);
      
      // Redirect to routing dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to register. Server may be offline.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-600/10 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-500 shadow-lg shadow-primary-500/10">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Join the performance management platform
          </p>
        </div>

        {/* Form Error Alert */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg flex items-start space-x-3 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 bg-slate-800/80 border ${
                    validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="John Doe"
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 bg-slate-800/80 border ${
                    validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="john.doe@company.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Grid for Role & Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="role" className="block text-xs font-medium text-slate-300">
                  System Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <label htmlFor="department" className="block text-xs font-medium text-slate-300">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  placeholder="e.g. Engineering"
                />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label htmlFor="designation" className="block text-xs font-medium text-slate-300">
                Designation / Job Title
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Briefcase className="h-4 w-4" />
                </div>
                <input
                  id="designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 bg-slate-800/80 border ${
                    validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 bg-slate-800/80 border ${
                    validationErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="••••••••"
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg shadow-primary-500/20"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center">
                  Register Account
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition duration-150" />
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <RouterLink to="/login" className="font-semibold text-primary-500 hover:text-primary-400 transition">
              Sign in
            </RouterLink>
          </p>
        </div>

      </div>
    </div>
  );
};
