import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout";
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  ActivitiesPage,
  ChallengesPage,
  LeaderboardPage,
  ProfilePage,
  StatisticsPage,
  ReportsPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./pages";

// Temporary placeholder component for admin pages
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-64">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-600">
      This page is being migrated. Please check back soon.
    </p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute requireAuth={false}>
                  <LandingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/register"
              element={
                <ProtectedRoute requireAuth={false}>
                  <RegisterPage />
                </ProtectedRoute>
              }
            />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/verify/:token" element={<VerifyEmailPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="challenges" element={<ChallengesPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin Routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <div>Admin Section</div>
                  </ProtectedRoute>
                }
              >
                <Route
                  path="users"
                  element={<ComingSoon title="User Management" />}
                />
                <Route
                  path="institutions"
                  element={<ComingSoon title="Institutions" />}
                />
                <Route
                  path="challenges"
                  element={<ComingSoon title="Manage Challenges" />}
                />
                <Route
                  path="factors"
                  element={<ComingSoon title="Emission Factors" />}
                />
                <Route
                  path="analytics"
                  element={<ComingSoon title="Analytics" />}
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
