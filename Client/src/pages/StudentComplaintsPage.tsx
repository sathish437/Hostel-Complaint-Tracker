import React, { useState } from 'react';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SlaTimer } from '../components/ui/SlaTimer';
import { ComplaintDetailModal } from '../components/modals/ComplaintDetailModal';
import { MapPin, ArrowRight, CheckCircle, Plus } from '@phosphor-icons/react';

interface StudentComplaintsPageProps {
  complaints: Complaint[];
  onOpenNewModal: () => void;
  onRefreshData: () => void;
}

export const StudentComplaintsPage: React.FC<StudentComplaintsPageProps> = ({
  complaints,
  onOpenNewModal,
  onRefreshData,
}) => {
  const { currentUser } = useAuth();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  if (!currentUser) return null;

  // Filter only complaints belonging to this authenticated student (Section 4 RBAC)
  const myComplaints = complaints.filter(
    (c) => c.studentId === currentUser.id || c.studentName === (currentUser.name || currentUser.fullName)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            My Complaints
          </h1>
          <p className="text-xs text-zinc-500 font-mono">
            {myComplaints.length} registered grievances
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={15} weight="bold" />
          <span>New Complaint</span>
        </button>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {myComplaints.length === 0 ? (
          <div className="py-14 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
            <CheckCircle size={36} className="mx-auto text-emerald-500" />
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No complaints yet
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Everything looks good. Create a complaint if you need help with anything.
              </p>
            </div>
            <button
              onClick={onOpenNewModal}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              + New Complaint
            </button>
          </div>
        ) : (
          myComplaints.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedComplaint(item)}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-600/50 hover:shadow-md cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      #{item.code}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize">
                      {item.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-red-600 dark:text-red-500" />
                      Room {item.roomNumber} ({item.block})
                    </span>
                  </div>
                </div>

                <span className="text-zinc-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight size={16} weight="bold" />
                </span>
              </div>

              {/* Status and Priority Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={item.priority} size="sm" />
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="text-xs font-mono text-zinc-500">
                  <SlaTimer
                    deadline={item.slaDeadline}
                    totalMinutes={item.slaTotalMinutes}
                    status={item.status}
                    showBar={false}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={(updated) => {
            setSelectedComplaint(updated);
            onRefreshData();
          }}
          onOpenAssignModal={() => {}}
        />
      )}
    </div>
  );
};
