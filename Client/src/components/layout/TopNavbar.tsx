import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { ComplaintService } from '../../services/complaintService';
import {
  List,
  Bell,
  Sun,
  Moon,
} from '@phosphor-icons/react';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  onOpenNewComplaintModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  onOpenNewComplaintModal,
}) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Notifications for current active user
  const notifications = currentUser
    ? StorageService.getNotifications().filter((n) => n.recipientId === currentUser.id)
    : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Breadcrumb / Title text
  const getPageTitle = () => {
    if (location.pathname === '/audit-logs') return 'Audit Trail Ledger';
    if (location.pathname === '/analytics') return 'SLA Performance & Telemetry';
    if (location.pathname.startsWith('/student/complaints/')) return 'Complaint Tracking';
    if (location.pathname === '/student/complaints') return 'My Complaints';
    if (location.pathname === '/student/profile') return 'Resident Profile';
    if (location.pathname === '/student/dashboard') return 'My Complaints';
    if (!currentUser) return 'Hostel Complaint Hub';
    return `${currentUser.role.replace('_', ' ')} Dashboard`;
  };

  const handleThemeToggle = () => {
    toggleTheme();
    showToast(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} mode`, 'info');
  };

  const handleMarkAllRead = () => {
    ComplaintService.markAllNotificationsRead(currentUser.id);
    setShowNotifMenu(false);
    showToast('All notifications marked as read', 'success');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          title="Open Menu"
        >
          <List size={20} weight="bold" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">Elevix</span>
          <span className="text-zinc-300 dark:text-zinc-600 hidden sm:inline">/</span>
          <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white font-sans tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Controls: Notifications, Theme Toggle, Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Pill per Section 2: ☀ Light / 🌙 Dark */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
          <button
            onClick={() => {
              if (theme !== 'light') {
                toggleTheme();
                showToast('Switched to Light mode', 'info');
              }
            }}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              theme === 'light'
                ? 'bg-white text-zinc-900 font-bold shadow-sm'
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
                ? 'bg-zinc-800 text-white font-bold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>🌙</span>
            <span className="hidden sm:inline">Dark</span>
          </button>
        </div>

        {/* Notifications Center */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
            }}
            className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell size={17} weight={unreadCount > 0 ? 'fill' : 'regular'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in text-zinc-900 dark:text-zinc-100">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400">
                  Notifications ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-mono"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400 font-mono">
                    No notifications for your profile.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        ComplaintService.markNotificationRead(n.id);
                        setShowNotifMenu(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        n.isRead
                          ? 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                          : 'bg-red-500/5 dark:bg-red-950/30 border-red-500/20 text-zinc-900 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold">{n.title}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logged in User Profile Info (Read-only) */}
        <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200">
          <img
            src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=U'}
            alt=""
            className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
          />
          <div className="text-left hidden md:block">
            <div className="font-bold text-zinc-900 dark:text-white leading-none">
              {currentUser.name || currentUser.fullName}
            </div>
            <div className="text-[10px] text-red-600 dark:text-red-400 font-mono font-semibold">
              {currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
