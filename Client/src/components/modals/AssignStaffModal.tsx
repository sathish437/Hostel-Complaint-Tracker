import React, { useState } from 'react';
import { Complaint, StaffMember } from '../../types';
import { StorageService } from '../../services/storage';
import { ComplaintService, CATEGORY_ROUTING } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserSwitch, Sparkle, X, Check, WarningCircle } from '@phosphor-icons/react';

interface AssignStaffModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSuccess: (updated: Complaint) => void;
}

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  complaint,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const staffMembers = StorageService.getStaff();

  const recommendedRole = CATEGORY_ROUTING[complaint.category];
  const suggestedStaff = staffMembers.find((s) => s.role === recommendedRole && s.isAvailable);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    complaint.assignedStaffId || suggestedStaff?.id || staffMembers[0]?.id || ''
  );
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isReassign = Boolean(complaint.assignedStaffId);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select a staff technician.');
      return;
    }

    if (isReassign && !reason.trim()) {
      setError('A mandatory reason is required for administrative reassignment override.');
      return;
    }

    try {
      const updated = ComplaintService.assignStaff(
        complaint.id,
        selectedStaffId,
        {
          name: currentUser.name || currentUser.fullName || 'Admin',
          role: currentUser.role,
          id: currentUser.id,
        },
        reason
      );
      showToast(
        isReassign
          ? `Grievance ${complaint.code} reassigned to ${updated.assignedStaffName}`
          : `Grievance ${complaint.code} assigned to ${updated.assignedStaffName}`,
        'success'
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign staff.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-500 flex items-center justify-center border border-red-600/30">
              <UserSwitch size={18} weight="bold" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {isReassign ? 'Administrative Reassignment Override' : 'Manual Staff Technician Assignment'}
              </h3>
              <p className="text-xs text-zinc-500 font-mono">{complaint.code} · {complaint.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="my-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{complaint.title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>Location: {complaint.block}, Room {complaint.roomNumber}</span>
            <span>·</span>
            <span>Current: {complaint.assignedStaffName || 'Unassigned Queue'}</span>
          </div>
        </div>

        {/* Rule Recommendation */}
        {suggestedStaff && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkle size={16} weight="fill" className="text-red-600 dark:text-red-400" />
              <span className="text-red-900 dark:text-red-200">
                Rule Recommendation: <strong>{suggestedStaff.name}</strong> ({suggestedStaff.role})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStaffId(suggestedStaff.id)}
              className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Select
            </button>
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Select Responsible Staff Member <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {staffMembers.map((staff) => {
                const isSelected = selectedStaffId === staff.id;
                const isSuggested = suggestedStaff?.id === staff.id;

                return (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-red-600/10 dark:bg-red-600/20 border-red-600 text-zinc-900 dark:text-white font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-400'
                        }`}
                      >
                        {isSelected && <Check size={10} weight="bold" />}
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {staff.name}
                          {isSuggested && (
                            <span className="text-[10px] bg-red-600/15 text-red-700 dark:text-red-400 px-1.5 py-0.2 rounded border border-red-600/25">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {staff.role} · Active load: {staff.activeJobsCount} jobs
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        staff.isAvailable
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {staff.isAvailable ? 'AVAILABLE' : 'BUSY'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {isReassign ? (
                <span>
                  Reassignment Reason <span className="text-red-500">* (Mandatory for Audit Trail)</span>
                </span>
              ) : (
                'Assignment Notes (Optional)'
              )}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isReassign ? 'e.g. Previous technician off-duty; emergency re-dispatch' : 'Any specific dispatch instructions...'}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <WarningCircle size={15} weight="fill" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserSwitch size={14} weight="bold" />
              <span>{isReassign ? 'Confirm Reassignment' : 'Assign Technician'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
