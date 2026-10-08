import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getRoleDashboardPath } from '../components/auth/ProtectedRoute';
import {
  Lightning,
  Eye,
  EyeSlash,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Wrench,
} from '@phosphor-icons/react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success && result.user) {
      showToast(`Welcome back, ${result.user.name || result.user.fullName}!`, 'success');
      // Redirect based on backend User.role
      const targetPath = getRoleDashboardPath(result.user.role);
      navigate(targetPath, { replace: true });
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  // Quick fill helper for testing/evaluating all 8 roles without role selector
  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 transition-all">
        {/* LEFT SIDE: Brand Identity, Vision & Visual */}
        <div className="bg-zinc-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-800">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Lightning size={22} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-white tracking-tight text-lg">ELEVIX</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 font-bold border border-red-500/30">
                    F5
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono tracking-tight block mt-0.5">
                  Hostel Complaint Tracker
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-mono pt-2">
              Autonomous SLA velocity, trade dispatch, and verified incident closure.
            </p>
          </div>

          {/* Clean Maintenance / Hostel Visual Card */}
          <div className="relative z-10 my-8 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Clock size={13} className="text-red-500" />
                Active SLA Guarantee
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={13} weight="fill" /> 98.4%
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full w-4/5" />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Auto-classification</span>
                <span>Role-aware routing</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300">
              <ShieldCheck size={16} className="text-red-500 shrink-0" />
              <span>Backend User role is the absolute source of truth</span>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Enterprise Session Management</span>
            <span>256-bit Encrypted</span>
          </div>
        </div>

        {/* RIGHT SIDE: Single Polished Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sign in to Hostel Complaint Tracker
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Please contact the hostel administration desk to reset credentials.', 'info');
                  }}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-mono"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 transition-colors font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Test Accounts for Easy Evaluation (Populates email only; Role is derived strictly by backend) */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">
              Quick Test Credentials:
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('rajesh@hostel.edu')}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('office@hostel.edu')}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Hostel Office
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('electrician@hostel.edu')}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Electrician
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cleaning@hostel.edu')}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Cleaning
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('warden@hostel.edu')}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Warden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
