import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setValidationError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setSuccessMessage(response.data.message || 'If that account exists, a reset link has been sent.');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to send reset link. Server may be offline.');
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
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enter your email and we'll send you a password recovery link
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg flex items-start space-x-3 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success State */}
        {successMessage ? (
          <div className="space-y-6 pt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 px-4 py-4 rounded-lg flex items-start space-x-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-medium text-emerald-300 block">Reset Link Sent</span>
                <p className="text-slate-300 leading-relaxed">{successMessage}</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-primary-500 hover:text-primary-400 transition"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to sign in page
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Registered Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border ${
                    validationError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary-500'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 sm:text-sm`}
                  placeholder="name@company.com"
                />
              </div>
              {validationError && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {validationError}
                </p>
              )}
            </div>

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
                    Send Reset Instructions
                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition duration-150" />
                  </span>
                )}
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-800/85">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
