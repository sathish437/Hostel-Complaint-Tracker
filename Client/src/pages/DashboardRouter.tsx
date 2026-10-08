import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Complaint, SystemSettings } from '../types';
import { StorageService } from '../services/storage';
import { StudentDashboard } from './StudentDashboard';
import { HostelOfficeDashboard } from './HostelOfficeDashboard';
import { StaffDashboard } from './StaffDashboard';
import { DeputyWardenDashboard } from './DeputyWardenDashboard';
import { WardenDashboard } from './WardenDashboard';
import { ComplaintDetailModal } from '../components/modals/ComplaintDetailModal';
import { AssignStaffModal } from '../components/modals/AssignStaffModal';

interface DashboardRouterProps {
  complaints: Complaint[];
  settings: SystemSettings;
  onRefreshData: () => void;
  onOpenNewModal: () => void;
}

export const DashboardRouter: React.FC<DashboardRouterProps> = ({
  complaints,
  settings,
  onRefreshData,
  onOpenNewModal,
}) => {
  const { currentUser } = useAuth();

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);

  const handleComplaintUpdated = (updated: Complaint) => {
    setSelectedComplaint(updated);
    onRefreshData();
  };

  const handleAssignSuccess = (updated: Complaint) => {
    onRefreshData();
    if (selectedComplaint && selectedComplaint.id === updated.id) {
      setSelectedComplaint(updated);
    }
  };

  const renderRoleDashboard = () => {
    switch (currentUser.role) {
      case 'HOSTEL_OFFICE':
        return (
          <HostelOfficeDashboard
            complaints={complaints}
            settings={settings}
            onSettingsUpdated={onRefreshData}
            onSelectComplaint={setSelectedComplaint}
            onOpenAssignModal={setAssigningComplaint}
          />
        );
      case 'DEPUTY_WARDEN':
        return (
          <DeputyWardenDashboard
            complaints={complaints}
            onSelectComplaint={setSelectedComplaint}
            onOpenAssignModal={setAssigningComplaint}
          />
        );
      case 'WARDEN':
        return (
          <WardenDashboard
            complaints={complaints}
            onSelectComplaint={setSelectedComplaint}
          />
        );
      case 'ELECTRICIAN':
      case 'CLEANING_WORKER':
      case 'MASTER':
      case 'WATCHMAN':
        return (
          <StaffDashboard
            complaints={complaints}
            onSelectComplaint={setSelectedComplaint}
          />
        );
      case 'STUDENT':
      default:
        return (
          <StudentDashboard
            complaints={complaints}
            onOpenNewModal={onOpenNewModal}
            onSelectComplaint={setSelectedComplaint}
          />
        );
    }
  };

  return (
    <div>
      {renderRoleDashboard()}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={handleComplaintUpdated}
          onOpenAssignModal={(c) => {
            setAssigningComplaint(c);
          }}
        />
      )}

      {/* Assign Staff Modal */}
      {assigningComplaint && (
        <AssignStaffModal
          complaint={assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};
