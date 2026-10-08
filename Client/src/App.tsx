import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StorageService } from './services/storage';
import { Complaint, SystemSettings } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { ProtectedRoute, getRoleDashboardPath } from './components/auth/ProtectedRoute';

// Page components
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentComplaintsPage } from './pages/StudentComplaintsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { HostelOfficeDashboard } from './pages/HostelOfficeDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { DeputyWardenDashboard } from './pages/DeputyWardenDashboard';
import { WardenDashboard } from './pages/WardenDashboard';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NewComplaintModal } from './components/modals/NewComplaintModal';
import { ComplaintDetailModal } from './components/modals/ComplaintDetailModal';
import { AssignStaffModal } from './components/modals/AssignStaffModal';

// Root index redirector
const RootRedirect: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">Initializing Hostel Complaint Hub...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleDashboardPath(currentUser.role)} replace />;
};

// Authenticated Layout Shell
const AuthenticatedShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());

  const refreshSettings = () => {
    setSettings(StorageService.getSettings());
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Sidebar (Desktop fixed + Mobile Drawer) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        settings={settings}
        onOpenNewModal={() => setIsNewModalOpen(true)}
      />

      {/* Main Workspace Offset */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <TopNavbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenNewComplaintModal={() => setIsNewModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 py-5 text-xs text-zinc-500 font-mono transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-zinc-900 dark:text-white font-semibold">
                ELEVIX 1.0 — F5 Hostel Complaint Tracker
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-zinc-500">Autonomous SLA Engine Active</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Black + Red Production Architecture · Dual Theme System
            </div>
          </div>
        </footer>
      </div>

      {/* Global New Complaint Modal */}
      <NewComplaintModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => {
          refreshSettings();
          window.dispatchEvent(new CustomEvent('complaints:refresh'));
        }}
      />
    </div>
  );
};

export const AppContent: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(() => StorageService.getSettings());
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);

  const refreshData = () => {
    setComplaints(StorageService.getComplaints());
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    refreshData();
    const handleRefresh = () => refreshData();
    window.addEventListener('complaints:refresh', handleRefresh);
    return () => window.removeEventListener('complaints:refresh', handleRefresh);
  }, []);

  return (
    <>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirect based on authenticated User.role */}
        <Route path="/" element={<RootRedirect />} />

        {/* 1. Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AuthenticatedShell>
                <StudentDashboard
                  complaints={complaints}
                  onOpenNewModal={() => setIsNewModalOpen(true)}
                  onSelectComplaint={setSelectedComplaint}
                />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/complaints"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AuthenticatedShell>
                <StudentDashboard
                  complaints={complaints}
                  onOpenNewModal={() => setIsNewModalOpen(true)}
                  onSelectComplaint={setSelectedComplaint}
                />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AuthenticatedShell>
                <StudentProfilePage />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />

        {/* 2. Worker Dashboard Route */}
        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ELECTRICIAN', 'CLEANING_WORKER', 'MASTER', 'WATCHMAN']}>
              <AuthenticatedShell>
                <StaffDashboard
                  complaints={complaints}
                  onSelectComplaint={setSelectedComplaint}
                />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />

        {/* 3. Hostel Office Dashboard Route */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOSTEL_OFFICE']}>
              <AuthenticatedShell>
                <HostelOfficeDashboard
                  complaints={complaints}
                  settings={settings}
                  onSettingsUpdated={refreshData}
                  onSelectComplaint={setSelectedComplaint}
                  onOpenAssignModal={setAssigningComplaint}
                />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />

        {/* 4. Deputy Warden Route */}
        <Route
          path="/deputy/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DEPUTY_WARDEN']}>
              <AuthenticatedShell>
                <DeputyWardenDashboard
                  complaints={complaints}
                  onSelectComplaint={setSelectedComplaint}
                  onOpenAssignModal={setAssigningComplaint}
                />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />

        {/* 5. Warden Route */}
        <Route
          path="/warden/dashboard"
          element={
            <ProtectedRoute allowedRoles={['WARDEN']}>
              <AuthenticatedShell>
                <WardenDashboard
                  complaints={complaints}
                  onSelectComplaint={setSelectedComplaint}
                />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />

        {/* 6. Administrative Tools (Audit Logs & Analytics) */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['HOSTEL_OFFICE', 'DEPUTY_WARDEN', 'WARDEN']}>
              <AuthenticatedShell>
                <AuditLogsPage />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['HOSTEL_OFFICE', 'DEPUTY_WARDEN', 'WARDEN']}>
              <AuthenticatedShell>
                <AnalyticsPage />
              </AuthenticatedShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>

      {/* Global Modals */}
      <NewComplaintModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={refreshData}
      />

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={(updated) => {
            setSelectedComplaint(updated);
            refreshData();
          }}
          onOpenAssignModal={setAssigningComplaint}
        />
      )}

      {assigningComplaint && (
        <AssignStaffModal
          complaint={assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          onSuccess={(updated) => {
            refreshData();
            if (selectedComplaint && selectedComplaint.id === updated.id) {
              setSelectedComplaint(updated);
            }
          }}
        />
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
