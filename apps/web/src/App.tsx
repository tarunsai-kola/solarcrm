import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoadingScreen } from '@/components/ui/loading-screen';

// ── Auth pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RoleLoginPage } from '@/features/auth/pages/RoleLoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';

// ── App pages
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { LeadsPage } from '@/features/leads/pages/LeadsPage';
import { FollowUpsPage } from '@/features/followups/pages/FollowUpsPage';
import { UserManagementPage } from '@/features/users/pages/UserManagementPage';
import { NotFoundPage } from '@/features/misc/pages/NotFoundPage';
import { CalendarPage } from '@/features/integrations/pages/CalendarPage';
import { IntegrationsPage } from '@/features/integrations/pages/IntegrationsPage';
import { QuotationsPage } from '@/features/quotations/pages/QuotationsPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { CustomersPage } from '@/features/customers/pages/CustomersPage';
import { CompanySettingsPage } from '@/features/settings/pages/CompanySettingsPage';
import { ReportsAnalyticsPage } from '@/features/reports/pages/ReportsAnalyticsPage';
import { AuditLogsPage } from '@/features/audit/pages/AuditLogsPage';
import { GoogleOAuthCallbackPage } from '@/features/integrations/pages/GoogleOAuthCallbackPage';
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';
import { RoleGuard } from '@/components/auth/RoleGuard';

// ── Marketing & Promotional Landing
import { KolaLandingPage } from '@/features/landing/pages/KolaLandingPage';
import { AdminLandingInquiriesPage } from '@/features/landing/pages/AdminLandingInquiriesPage';
import { PublicProposalPortalPage } from '@/features/quotations/pages/PublicProposalPortalPage';
import { SolarEstimatorPage } from '@/features/calculator/pages/SolarEstimatorPage';
import { SiteVisitsPage } from '@/features/site-visits/pages/SiteVisitsPage';
import { ServiceTicketsPage } from '@/features/service-tickets/pages/ServiceTicketsPage';
import { ReferralsPage } from '@/features/referrals/pages/ReferralsPage';
import { ComplianceVaultPage } from '@/features/compliance/pages/ComplianceVaultPage';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ── Public Promotional Landing Page (Kola Software Solar VCRM) ── */}
          <Route path="/" element={<KolaLandingPage />} />
          <Route path="/landing" element={<KolaLandingPage />} />
          <Route path="/admin/landing-inquiries" element={<AdminLandingInquiriesPage />} />
          <Route path="/landing-leads" element={<AdminLandingInquiriesPage />} />

          {/* ── Public Proposal Portal (Customer View & Digital E-Signature) ── */}
          <Route path="/proposals/view/:quoteId" element={<PublicProposalPortalPage />} />
          <Route path="/quote/verify/:quoteId" element={<PublicProposalPortalPage />} />

          {/* ── Auth routes ── */}
          <Route
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthLayout />}
          >
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<RoleLoginPage portalRole="admin" />} />
            <Route path="/inbound-sales-login" element={<RoleLoginPage portalRole="inbound_sales" />} />
            <Route path="/field-agent-login" element={<RoleLoginPage portalRole="field_agent" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* ── Protected app routes ── */}
          <Route
            element={!isAuthenticated ? <Navigate to="/login" replace /> : <AppLayout />}
          >
            <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads/*" element={<LeadsPage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="/site-visits" element={<SiteVisitsPage />} />
          <Route path="/surveys" element={<SiteVisitsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/service-tickets" element={<ServiceTicketsPage />} />
          <Route path="/amc-service" element={<ServiceTicketsPage />} />
          <Route path="/calculator" element={<SolarEstimatorPage />} />
          <Route path="/solar-sizer" element={<SolarEstimatorPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/advocates" element={<ReferralsPage />} />
          <Route path="/compliance-vault" element={<ComplianceVaultPage />} />
          <Route path="/documents" element={<ComplianceVaultPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations/google/callback" element={<GoogleOAuthCallbackPage />} />
          <Route path="/integrations/google/callback" element={<GoogleOAuthCallbackPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/user-management"
            element={
              <RoleGuard roles={['admin']}>
                <UserManagementPage />
              </RoleGuard>
            }
          />
          <Route
            path="/company-settings"
            element={
              <RoleGuard roles={['admin']}>
                <CompanySettingsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleGuard roles={['admin', 'inbound_sales']}>
                <ReportsAnalyticsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <RoleGuard roles={['admin']}>
                <AuditLogsPage />
              </RoleGuard>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);
}
