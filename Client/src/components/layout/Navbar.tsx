import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { ComplaintService } from '../../services/complaintService';
import {
  Bell,
  Plus,
  ShieldCheck,
  UserCircle,
  Check,
  ArrowRight,
  Trash,
  Lightning,
} from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  onOpenNewComplaintModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewComplaintModal }) => {
  const { currentUser, switchUserRole } = useAuth();
  const location = useLocation();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const notifications = StorageService.getNotifications().filter(
    (n) => n.recipientId === currentUser.id
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roles: { role: UserRole; label: string; group: string }[] = [
    { role: 'STUDENT', label: 'Student (Rajesh Kumar)', group: 'Residents' },
    { role: 'HOSTEL_OFFICE', label: 'Hostel Office Admin', group: 'Administration' },
    { role: 'ELECTRICIAN', label: 'Electrician (Murugan)', group: 'Maintenance Staff' },
    { role: 'CLEANING_WORKER', label: 'Sanitation Worker (Ramesh)', group: 'Maintenance Staff' },
    { role: 'MASTER', label: 'Mess Master (Chef Suresh)', group: 'Mess Staff' },
    { role: 'WATCHMAN', label: 'Watchman (Bahadur Singh)', group: 'Security Staff' },
    { role: 'DEPUTY_WARDEN', label: 'Deputy Warden (Dr. Sen)', group: 'Hostel Leadership' },
    { role: 'WARDEN', label: 'Chief Warden (Prof. Venkatesh)', group: 'Hostel Leadership' },
  ];

  const handleMarkAllRead = () => {
    ComplaintService.markAllNotificationsRead(currentUser.id);
    setShowNotifMenu(false);
  };

  const isRoleActive = (r: UserRole) => currentUser.role === r;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Lightning size={20} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">ELEVIX</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  F5 Tracker
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5 font-mono">
                Hostel Incident & SLA Hub
              </span>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Dashboard
            </Link>

            {(currentUser.role === 'HOSTEL_OFFICE' || currentUser.role === 'WARDEN' || currentUser.role === 'DEPUTY_WARDEN') && (
              <Link
                to="/audit-logs"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/audit-logs'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Audit Trail
              </Link>
            )}

            {(currentUser.role === 'WARDEN' || currentUser.role === 'HOSTEL_OFFICE') && (
              <Link
                to="/analytics"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/analytics'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                SLA Analytics
              </Link>
            )}
          </nav>
        </div>

        {/* Right side tools */}
        <div className="flex items-center gap-3">
          {/* Quick Submit Button (Visible for all or student) */}
          <button
            onClick={onOpenNewComplaintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">New Complaint</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowRoleMenu(false);
              }}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase font-mono">
                    Notifications ({notifications.length})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-mono"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono">
                      No notifications for this role yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          ComplaintService.markNotificationRead(n.id);
                          setShowNotifMenu(false);
                        }}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.isRead
                            ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                            : 'bg-indigo-950/30 border-indigo-500/30 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-white">{n.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logged in User Profile Info (Read-only) */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
            <img
              src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=U'}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-slate-700"
            />
            <span className="font-semibold max-w-[120px] truncate hidden sm:inline">
              {currentUser.name || currentUser.fullName}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-red-400 border border-slate-700 font-semibold">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
