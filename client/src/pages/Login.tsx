import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, User } from '../context/AuthContext';
import api from '../lib/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  // Client-side validation
  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data as { token: string; user: User };

      // Set context and localStorage
      login(token, user);
      
      // Redirect to the main smart dashboard route which handles role-based views
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to connect to the authentication server. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-600/10 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-500 shadow-lg shadow-primary-500/10">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to access your performance dashboard
          </p>
        </div>

        {/* Form Error Message */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg flex items-start space-x-3 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border ${
                    validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="name@company.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary-500 hover:text-primary-400 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border ${
                    validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg shadow-primary-500/20"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="flex items-center">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition duration-150" />
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-500 hover:text-primary-400 transition">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
