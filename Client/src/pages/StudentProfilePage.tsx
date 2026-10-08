import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, IdentificationCard, EnvelopeSimple, Phone, ShieldCheck } from '@phosphor-icons/react';

export const StudentProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-2xl border border-red-500/20">
            {(currentUser.name || currentUser.fullName || 'U').charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {currentUser.name || currentUser.fullName}
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Hostel Resident · Room {currentUser.roomNumber || 'B-203'} ({currentUser.block || 'Block B'})
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details per Section 7 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-zinc-700 dark:text-zinc-300 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          Account Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Name</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User size={16} className="text-red-600" />
              <span>{currentUser.name || currentUser.fullName}</span>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Email</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <EnvelopeSimple size={16} className="text-red-600" />
              <span>{currentUser.email}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Phone</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Phone size={16} className="text-red-600" />
              <span>{currentUser.phone || currentUser.phoneNumber || 'Not provided'}</span>
            </div>
          </div>

          {/* Role (Read-only per Section 7) */}
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Role</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="capitalize">{currentUser.role.toLowerCase().replace('_', ' ')} (Read-only)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
