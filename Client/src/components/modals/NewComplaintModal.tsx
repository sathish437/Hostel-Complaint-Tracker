import React, { useState } from 'react';
import { ComplaintCategory } from '../../types';
import { ComplaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Plus,
  Camera,
  Warning,
  MapPin,
} from '@phosphor-icons/react';

interface NewComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (complaint: any) => void;
}

// User-friendly categories per Section 9
const USER_FRIENDLY_CATEGORIES: { id: ComplaintCategory; label: string; icon: string }[] = [
  { id: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
  { id: 'WATER_PLUMBING', label: 'Water & Plumbing', icon: '🚰' },
  { id: 'CLEANING_HYGIENE', label: 'Cleaning', icon: '🧹' },
  { id: 'ROOM_FURNITURE', label: 'Room & Furniture', icon: '🛏' },
  { id: 'INTERNET', label: 'Wi-Fi', icon: '🌐' },
  { id: 'FOOD_MESS', label: 'Food / Mess', icon: '🍛' },
  { id: 'SECURITY', label: 'Security', icon: '🔐' },
  { id: 'GENERAL', label: 'Hostel Environment', icon: '🔊' },
];

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<ComplaintCategory>('ELECTRICAL');
  const [description, setDescription] = useState('');
  const [roomNumber, setRoomNumber] = useState(currentUser.roomNumber || 'B-203');
  const [block, setBlock] = useState(currentUser.block || 'Block B');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isRepeatedIssue = ComplaintService.checkRepeatedIssue(roomNumber, category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !roomNumber.trim()) return;

    setIsSubmitting(true);
    try {
      // Inferred title from first sentence/line of description
      const title = description.trim().split('\n')[0].slice(0, 60);

      const created = ComplaintService.createComplaint({
        studentId: currentUser.id,
        studentName: currentUser.name || currentUser.fullName || 'Resident',
        roomNumber: roomNumber.trim(),
        block: block.trim(),
        category,
        title: title || 'Maintenance Request',
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });

      showToast(`Complaint registered! Tracking ID: ${created.code}`, 'success');
      onCreated(created);
      onClose();
      setDescription('');
      setEvidenceUrl('');
    } catch (err) {
      console.error(err);
      showToast('Could not register complaint. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Raise a Complaint
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Submit your maintenance issue in under 30 seconds
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Recurring Warning */}
        {isRepeatedIssue && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Warning size={17} weight="bold" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Recurring Issue:</strong> A similar complaint in Room {roomNumber} was previously registered. Our system will prioritize this with the supervisor.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* 1. What is the problem? Category */}
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
              What is the problem? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {USER_FRIENDLY_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left text-xs transition-all flex flex-col items-start gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-red-600/10 dark:bg-red-600/20 border-red-600 text-red-600 dark:text-red-400 font-bold shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[11px] leading-tight line-clamp-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Describe your problem per Section 9 & 25 */}
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Describe your problem <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what happened... e.g. Fan stopped working since morning."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* 3. Where is the problem? per Section 9 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Hostel Block
              </label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Block D">Block D</option>
                <option value="Mess Hall">Mess Hall</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Room / Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. B-203"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* 4. Add photo (optional) per Section 9 */}
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Add photo (optional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="Paste image link: https://..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => setEvidenceUrl('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80')}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors shrink-0"
                title="Use demo sample photo"
              >
                Sample Photo
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !description.trim() || !roomNumber.trim()}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
