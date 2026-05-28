import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import GuideRoute from './GuideRoute';
import PublicRoute from './PublicRoute';

// Loader
import { FullPageLoader } from '../components/common/Loader';

// Lazy loaded public pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const InternshipsPage = lazy(() => import('../pages/public/InternshipsPage'));
const InternshipDetailPage = lazy(() => import('../pages/public/InternshipDetailPage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));

// Lazy loaded auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));

// Lazy loaded student pages
const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'));
const ApplicationFormPage = lazy(() => import('../pages/student/ApplicationFormPage'));
const MyApplicationsPage = lazy(() => import('../pages/student/MyApplicationsPage'));
const PaymentPage = lazy(() => import('../pages/student/PaymentPage'));
const ProfilePage = lazy(() => import('../pages/student/ProfilePage'));
const StudentTasksPage = lazy(() => import('../pages/student/StudentTasksPage'));
const StudentCalendarPage = lazy(() => import('../pages/student/StudentCalendarPage'));
const MyCertificatesPage = lazy(() => import('../pages/student/MyCertificatesPage'));

// Lazy loaded admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminInternshipsPage = lazy(() => import('../pages/admin/AdminInternshipsPage'));
const AdminApplicationsPage = lazy(() => import('../pages/admin/AdminApplicationsPage'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminTasksPage = lazy(() => import('../pages/admin/AdminTasksPage'));
const AdminCalendarPage = lazy(() => import('../pages/admin/AdminCalendarPage'));
const CertificateGeneratorPage = lazy(() => import('../pages/admin/CertificateGeneratorPage'));

// Lazy loaded guide pages
const GuideDashboard = lazy(() => import('../pages/guide/GuideDashboard'));
const GuideStudentsPage = lazy(() => import('../pages/guide/GuideStudentsPage'));
const GuideStudentDetailPage = lazy(() => import('../pages/guide/GuideStudentDetailPage'));
const GuideProfilePage = lazy(() => import('../pages/guide/GuideProfilePage'));
const GuideTasksPage = lazy(() => import('../pages/guide/GuideTasksPage'));
const GuideCalendarPage = lazy(() => import('../pages/guide/GuideCalendarPage'));
const CertificateVerifyPage = lazy(() => import('../pages/public/CertificateVerifyPage'));

// Lazy loaded Chat page
const ChatPage = lazy(() => import('../pages/chat/ChatPage'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullPageLoader message="Loading page..." />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/internships/:id" element={<InternshipDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/verify-certificate/:certificateId" element={<CertificateVerifyPage />} />
          
          {/* Protected apply route (uses public layout header/footer) */}
          <Route
            path="/internships/:id/apply"
            element={
              <ProtectedRoute>
                <ApplicationFormPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Auth Routes (Restricted for logged-in users) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email/:token"
          element={
            <PublicRoute>
              <VerifyEmailPage />
            </PublicRoute>
          }
        />

        {/* Student Dashboard Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <DashboardLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="applications" element={<MyApplicationsPage />} />
          <Route path="tasks" element={<StudentTasksPage />} />
          <Route path="calendar" element={<StudentCalendarPage />} />
          <Route path="certificates" element={<MyCertificatesPage />} />
          <Route path="payments" element={<PaymentPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>

        {/* Guide Dashboard Routes */}
        <Route
          path="/guide"
          element={
            <ProtectedRoute>
              <GuideRoute>
                <DashboardLayout role="guide" />
              </GuideRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/guide/dashboard" replace />} />
          <Route path="dashboard" element={<GuideDashboard />} />
          <Route path="students" element={<GuideStudentsPage />} />
          <Route path="students/:id" element={<GuideStudentDetailPage />} />
          <Route path="tasks" element={<GuideTasksPage />} />
          <Route path="calendar" element={<GuideCalendarPage />} />
          <Route path="profile" element={<GuideProfilePage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <DashboardLayout role="admin" />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="internships" element={<AdminInternshipsPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="certificates" element={<CertificateGeneratorPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
