import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getRoleDashboardPath } from '../components/auth/ProtectedRoute';
import {
  Lightning,
  Eye,
  EyeSlash,
  ArrowRight,
} from '@phosphor-icons/react';

import type { Variants } from 'framer-motion';

// Animation variants per specification
const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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

  // Supported Quick Test Credentials using exact project data
  const quickCredentials = [
    { label: 'Student', email: 'rajesh@hostel.edu' },
    { label: 'Hostel Office', email: 'office@hostel.edu' },
    { label: 'Electrician', email: 'electrician@hostel.edu' },
    { label: 'Cleaning', email: 'cleaning@hostel.edu' },
    { label: 'Deputy Warden', email: 'deputy@hostel.edu' },
    { label: 'Warden', email: 'warden@hostel.edu' },
  ];

  // Quick fill populates the form without bypassing backend login
  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 relative transition-colors duration-200">
      {/* Theme Toggle Pill in Top Corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono shadow-sm">
          <button
            onClick={() => {
              if (theme !== 'light') {
                toggleTheme();
                showToast('Switched to Light mode', 'info');
              }
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'light'
                ? 'bg-zinc-100 text-zinc-900 font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>☀</span>
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            onClick={() => {
              if (theme !== 'dark') {
                toggleTheme();
                showToast('Switched to Dark mode', 'info');
              }
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-zinc-800 text-white font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>🌙</span>
            <span className="hidden sm:inline">Dark</span>
          </button>
        </div>
      </div>

      {/* Main Refined Login Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl dark:shadow-2xl p-7 sm:p-9 space-y-6 relative transition-colors"
      >
        {/* Brand Icon & Heading */}
        <motion.div variants={itemVariants} className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-red-600 text-white mb-2 shadow-lg shadow-red-600/25">
            <Lightning size={22} weight="fill" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sign in to Hostel Complaint Tracker
          </p>
        </motion.div>

        {/* Clean Animated Error Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 font-medium"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <motion.div variants={itemVariants} className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all duration-200"
            />
          </motion.div>

          {/* Password Field with Eye Icon */}
          <motion.div variants={itemVariants} className="space-y-1.5 text-left">
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
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all duration-200 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={showPassword ? 'eye-slash' : 'eye'}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </motion.div>

          {/* Single Red Sign In Button with Motion */}
          <motion.div variants={itemVariants} className="pt-2">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full h-11 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-600/25 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight size={14} weight="bold" />
                </div>
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Quick Test Credentials Section */}
        <motion.div
          variants={itemVariants}
          className="pt-5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5 text-left"
        >
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block tracking-wider">
            Quick Test Credentials:
          </span>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
            {quickCredentials.map((cred) => (
              <motion.button
                key={cred.email}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={() => handleQuickFill(cred.email)}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer border border-zinc-200/60 dark:border-zinc-700/60"
              >
                {cred.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
