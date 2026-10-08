import React, { useState } from 'react';
import { SystemSettings } from '../../types';
import { ComplaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Robot, HandGrabbing, CheckCircle, Clock } from '@phosphor-icons/react';

interface AutomationControlCardProps {
  settings: SystemSettings;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
}

export const AutomationControlCard: React.FC<AutomationControlCardProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isToggling, setIsToggling] = useState(false);

  const isAuthorized = currentUser.role === 'HOSTEL_OFFICE' || currentUser.role === 'WARDEN';

  const handleToggle = () => {
    if (!isAuthorized) {
      showToast('Only Hostel Office or Warden can modify the Assignment Automation setting.', 'error');
      return;
    }

    setIsToggling(true);
    const newMode = !settings.assignmentAutomationEnabled;
    const updated = ComplaintService.toggleAutomationMode(newMode, {
      name: currentUser.name || currentUser.fullName || 'Admin',
      role: currentUser.role,
    });

    onSettingsUpdated(updated);
    showToast(`Assignment Mode set to ${newMode ? 'AUTOMATIC (ON)' : 'MANUAL (OFF)'}`, 'success');
    setIsToggling(false);
  };

  const isAuto = settings.assignmentAutomationEnabled;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-red-600 dark:text-red-500">
              Hostel Office Core Setting
            </span>
            <span className="text-zinc-400">·</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono ${
                isAuto
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAuto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isAuto ? 'AUTOMATIC ROUTING' : 'MANUAL DISPATCH'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            {isAuto ? (
              <Robot size={22} className="text-red-600 dark:text-red-500" />
            ) : (
              <HandGrabbing size={22} className="text-amber-600 dark:text-amber-500" />
            )}
            Complaint Assignment Automation
          </h3>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
            {isAuto ? (
              <span>
                <strong className="text-zinc-900 dark:text-zinc-200">AUTOMATIC (ON):</strong> New complaints are instantly matched and assigned to designated technicians according to trade routing rules (e.g. Electrical → Electrician, Food → Mess Master).
              </span>
            ) : (
              <span>
                <strong className="text-zinc-900 dark:text-zinc-200">MANUAL (OFF):</strong> New complaints enter the unassigned Hostel Office queue and await explicit assignment by office administrators.
              </span>
            )}
          </p>

          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Last toggled: {new Date(settings.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>·</span>
            <span>By: {settings.updatedBy}</span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl">
            <span className={`text-xs font-semibold font-mono ${!isAuto ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-zinc-400'}`}>
              MANUAL
            </span>

            <button
              onClick={handleToggle}
              disabled={isToggling || !isAuthorized}
              title={isAuthorized ? 'Click to toggle automation mode' : 'Requires Hostel Office or Warden permissions'}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 ${
                isAuto ? 'bg-red-600' : 'bg-zinc-400 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAuto ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-xs font-semibold font-mono ${isAuto ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-400'}`}>
              AUTOMATIC
            </span>
          </div>

          {!isAuthorized && (
            <span className="text-[10px] text-zinc-400 italic">
              Switch role to Hostel Office or Warden to modify
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
