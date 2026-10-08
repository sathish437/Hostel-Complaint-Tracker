import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SystemSettings, UserRole } from '../../types';
import {
  House,
  ClipboardText,
  FileText,
  ChartPie,
  ShieldWarning,
  Robot,
  Plus,
  X,
  Lightning,
  SignOut,
  User as UserIcon,
} from '@phosphor-icons/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onOpenNewModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenNewModal,
}) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const isAuto = settings.assignmentAutomationEnabled;
  const isActive = (path: string) => location.pathname === path;

  // Role-specific navigation items per Section 4 & 5
  const getNavLinks = () => {
    switch (currentUser.role) {
      case 'STUDENT':
        return [
          { to: '/student/dashboard', label: 'Problem Status', icon: ClipboardText },
          { to: '/student/profile', label: 'Profile', icon: UserIcon },
        ];
      case 'ELECTRICIAN':
      case 'CLEANING_WORKER':
      case 'MASTER':
      case 'WATCHMAN':
        return [
          { to: '/worker/dashboard', label: 'Dashboard', icon: House },
        ];
      case 'HOSTEL_OFFICE':
        return [
          { to: '/staff/dashboard', label: 'Dashboard', icon: House },
          { to: '/audit-logs', label: 'Escalations', icon: ShieldWarning },
          { to: '/analytics', label: 'Settings', icon: Robot },
        ];
      case 'DEPUTY_WARDEN':
        return [
          { to: '/deputy/dashboard', label: 'Dashboard', icon: House },
          { to: '/audit-logs', label: 'Escalations', icon: ShieldWarning },
          { to: '/analytics', label: 'Analytics', icon: ChartPie },
        ];
      case 'WARDEN':
      default:
        return [
          { to: '/warden/dashboard', label: 'Dashboard', icon: House },
          { to: '/analytics', label: 'Analytics', icon: ChartPie },
          { to: '/audit-logs', label: 'Compliance Audit', icon: FileText },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="h-16 px-5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
            <Link to="/" onClick={onClose} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Lightning size={18} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-base">
                    ELEVIX
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-red-600/10 text-red-600 dark:text-red-400 font-bold border border-red-600/20">
                    F5
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-tight block mt-0.5">
                  Hostel Operations Hub
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action Button for Students */}
          {currentUser.role === 'STUDENT' && (
            <div className="p-4">
              <button
                onClick={() => {
                  onOpenNewModal();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={15} weight="bold" />
                <span>Register Grievance</span>
              </button>
            </div>
          )}

          {/* Automation Mode Status Banner */}
          <div className="px-4 my-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Robot size={13} /> Routing Mode:
                </span>
                <span
                  className={`font-bold flex items-center gap-1 px-1.5 py-0.2 rounded ${
                    isAuto
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAuto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isAuto ? 'AUTOMATIC' : 'MANUAL'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                {isAuto ? 'Tickets auto-routed to trade staff.' : 'Tickets queued for Office dispatch.'}
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
              Navigation
            </div>
            {navLinks.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-red-600/10 dark:bg-red-600/15 text-red-600 dark:text-red-400 font-semibold border border-red-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon size={16} weight={active ? 'bold' : 'regular'} className={active ? 'text-red-600 dark:text-red-400' : ''} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Role Status & Sign Out */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
          {/* Active User Card */}
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-red-600/15 text-red-600 font-bold text-xs flex items-center justify-center shrink-0">
                {(currentUser.name || currentUser.fullName || 'U').charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  {currentUser.name || currentUser.fullName}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate capitalize">
                  {currentUser.role.toLowerCase().replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full text-center text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 py-1.5 font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer rounded-lg hover:bg-red-500/10"
          >
            <SignOut size={13} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
