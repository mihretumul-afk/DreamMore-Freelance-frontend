/* eslint-disable react/only-export-components -- route configuration, not a component module */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { PageLoader } from '../components/common/Loading';
import { ROLES } from '../constants/app';

// Lazy-loaded pages — split into chunks, loaded on first visit.
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const JobsPage = lazy(() => import('../pages/public/JobsPage'));
const JobDetailsPage = lazy(() => import('../pages/public/JobDetailsPage'));
const FreelancersPage = lazy(() => import('../pages/public/FreelancersPage'));
const FreelancerDetailsPage = lazy(() => import('../pages/public/FreelancerDetailsPage'));
const CategoriesPage = lazy(() => import('../pages/public/CategoriesPage'));

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));

const FreelancerDashboardPage = lazy(() => import('../pages/freelancer/DashboardPage'));
const FreelancerProfilePage = lazy(() => import('../pages/freelancer/ProfilePage'));
const FreelancerProfileEditPage = lazy(() => import('../pages/freelancer/ProfileEditPage'));
const FreelancerJobsPage = lazy(() => import('../pages/freelancer/JobsPage'));
const FreelancerProposalsPage = lazy(() => import('../pages/freelancer/ProposalsPage'));
const FreelancerProposalDetailsPage = lazy(() => import('../pages/freelancer/ProposalDetailsPage'));
const FreelancerContractsPage = lazy(() => import('../pages/freelancer/ContractsPage'));
const FreelancerContractDetailsPage = lazy(() => import('../pages/freelancer/ContractDetailsPage'));
const FreelancerMessagesPage = lazy(() => import('../pages/freelancer/MessagesPage'));
const FreelancerNotificationsPage = lazy(() => import('../pages/freelancer/NotificationsPage'));
const FreelancerSavedJobsPage = lazy(() => import('../pages/freelancer/SavedJobsPage'));
const FreelancerCredentialsPage = lazy(() => import('../pages/freelancer/CredentialsPage'));

const EmployerDashboardPage = lazy(() => import('../pages/employer/DashboardPage'));
const EmployerProfilePage = lazy(() => import('../pages/employer/ProfilePage'));
const EmployerProfileEditPage = lazy(() => import('../pages/employer/ProfileEditPage'));
const EmployerJobsPage = lazy(() => import('../pages/employer/JobsPage'));
const EmployerJobCreatePage = lazy(() => import('../pages/employer/JobCreatePage'));
const EmployerJobDetailsPage = lazy(() => import('../pages/employer/JobDetailsPage'));
const EmployerJobEditPage = lazy(() => import('../pages/employer/JobEditPage'));
const EmployerJobProposalsPage = lazy(() => import('../pages/employer/JobProposalsPage'));
const EmployerContractsPage = lazy(() => import('../pages/employer/ContractsPage'));
const EmployerContractDetailsPage = lazy(() => import('../pages/employer/ContractDetailsPage'));
const EmployerMessagesPage = lazy(() => import('../pages/employer/MessagesPage'));
const EmployerNotificationsPage = lazy(() => import('../pages/employer/NotificationsPage'));
const EmployerSavedFreelancersPage = lazy(() => import('../pages/employer/SavedFreelancersPage'));

const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/UsersPage'));
const AdminUserDetailPage = lazy(() => import('../pages/admin/UserDetailPage'));
const AdminVerificationsPage = lazy(() => import('../pages/admin/VerificationsPage'));
const AdminJobsPage = lazy(() => import('../pages/admin/JobsPage'));
const AdminReportsPage = lazy(() => import('../pages/admin/ReportsPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/CategoriesPage'));
const AdminSkillsPage = lazy(() => import('../pages/admin/SkillsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/SettingsPage'));

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

/** Wraps a lazy page with a Suspense fallback. */
const lazyPage = (page) => (
  <Suspense fallback={<PageLoader />}>{page}</Suspense>
);

export const router = createBrowserRouter([
  // ---- Public marketplace ----
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: lazyPage(<LandingPage />) },
      { path: 'jobs', element: lazyPage(<JobsPage />) },
      { path: 'jobs/:id', element: lazyPage(<JobDetailsPage />) },
      { path: 'freelancers', element: lazyPage(<FreelancersPage />) },
      { path: 'freelancers/:id', element: lazyPage(<FreelancerDetailsPage />) },
      { path: 'categories', element: lazyPage(<CategoriesPage />) },
    ],
  },

  // ---- Authentication ----
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: lazyPage(<LoginPage />) },
      { path: 'register', element: lazyPage(<RegisterPage />) },
      { path: 'forgot-password', element: lazyPage(<ForgotPasswordPage />) },
    ],
  },

  // ---- Admin area ----
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: 'admin',
        element: (
          <RoleRoute roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(<AdminDashboardPage />) },
          { path: 'users', element: lazyPage(<AdminUsersPage />) },
          { path: 'users/:id', element: lazyPage(<AdminUserDetailPage />) },
          { path: 'verifications', element: lazyPage(<AdminVerificationsPage />) },
          { path: 'jobs', element: lazyPage(<AdminJobsPage />) },
          { path: 'reports', element: lazyPage(<AdminReportsPage />) },
          { path: 'categories', element: lazyPage(<AdminCategoriesPage />) },
          { path: 'skills', element: lazyPage(<AdminSkillsPage />) },
          { path: 'settings', element: lazyPage(<AdminSettingsPage />) },
        ],
      },
    ],
  },

  // ---- Protected role areas ----
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: 'freelancer',
        element: (
          <RoleRoute roles={[ROLES.FREELANCER]}>
            <DashboardLayout role="freelancer" />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(<FreelancerDashboardPage />) },
          { path: 'profile', element: lazyPage(<FreelancerProfilePage />) },
          { path: 'profile/edit', element: lazyPage(<FreelancerProfileEditPage />) },
          { path: 'jobs', element: lazyPage(<FreelancerJobsPage />) },
          { path: 'proposals', element: lazyPage(<FreelancerProposalsPage />) },
          { path: 'proposals/:id', element: lazyPage(<FreelancerProposalDetailsPage />) },
          { path: 'contracts', element: lazyPage(<FreelancerContractsPage />) },
          { path: 'contracts/:id', element: lazyPage(<FreelancerContractDetailsPage />) },
          { path: 'saved-jobs', element: lazyPage(<FreelancerSavedJobsPage />) },
          { path: 'credentials', element: lazyPage(<FreelancerCredentialsPage />) },
          { path: 'messages', element: lazyPage(<FreelancerMessagesPage />) },
          { path: 'notifications', element: lazyPage(<FreelancerNotificationsPage />) },
        ],
      },
      {
        path: 'employer',
        element: (
          <RoleRoute roles={[ROLES.EMPLOYER]}>
            <DashboardLayout role="employer" />
          </RoleRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: lazyPage(<EmployerDashboardPage />) },
          { path: 'profile', element: lazyPage(<EmployerProfilePage />) },
          { path: 'profile/edit', element: lazyPage(<EmployerProfileEditPage />) },
          { path: 'jobs', element: lazyPage(<EmployerJobsPage />) },
          { path: 'jobs/create', element: lazyPage(<EmployerJobCreatePage />) },
          { path: 'jobs/:id', element: lazyPage(<EmployerJobDetailsPage />) },
          { path: 'jobs/:id/edit', element: lazyPage(<EmployerJobEditPage />) },
          { path: 'jobs/:id/proposals', element: lazyPage(<EmployerJobProposalsPage />) },
          { path: 'contracts', element: lazyPage(<EmployerContractsPage />) },
          { path: 'contracts/:id', element: lazyPage(<EmployerContractDetailsPage />) },
          { path: 'saved-freelancers', element: lazyPage(<EmployerSavedFreelancersPage />) },
          { path: 'messages', element: lazyPage(<EmployerMessagesPage />) },
          { path: 'notifications', element: lazyPage(<EmployerNotificationsPage />) },
        ],
      },
    ],
  },

  // ---- 404 ----
  { path: '*', element: lazyPage(<NotFoundPage />) },
]);
