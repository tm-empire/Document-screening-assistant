import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewVerification } from './pages/NewVerification';
import { VerificationResult } from './pages/VerificationResult';
import { Cases } from './pages/Cases';
import { HighRisk } from './pages/HighRisk';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';
import { VerificationReport } from './pages/VerificationReport';

// Protected Route Wrapper
const ProtectedLayout = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-verification" element={<NewVerification />} />
            <Route path="/verification/:caseId" element={<VerificationResult />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/high-risk" element={<HighRisk />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/report/:caseId" element={<VerificationReport />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Router>
      </CaseProvider>
    </AuthProvider>
  );
}
