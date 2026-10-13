import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { ProtectedLayout } from './components/common/ProtectedLayout';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicPortfolioPage } from './pages/PlaceholderPages';
import {
  ResumeBuilderPage,
  PortfolioPage,
  CoverLetterPage,
  JobAnalyzerPage,
  SkillGapPage,
  ApplicationTrackerPage,
} from './pages/PlaceholderPages';

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/resumes" element={<ResumeBuilderPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/cover-letters" element={<CoverLetterPage />} />
              <Route path="/job-analyzer" element={<JobAnalyzerPage />} />
              <Route path="/skill-gap" element={<SkillGapPage />} />
              <Route path="/applications" element={<ApplicationTrackerPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
