import { Provider } from "react-redux";
import { store } from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BrandProvider } from "./contexts/BrandContext";
import { LeadsProvider } from "./contexts/LeadsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthenticatedRedirect from "./components/auth/AuthenticatedRedirect";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SecurityMonitor from "./components/security/SecurityMonitor";
import ListingUser from "./components/users/ListingUser";
import ListingProject from "./components/projects/ListingProject";
import CreateProject from "./components/projects/CreateProject";
import EditProjectForm from "./components/projects/EditProjectForm";
import EditProject from "./components/projects/multistepFormEdit/EditProject";
import ProjectManagement from "./components/projects/ProjectManagement";
import Layout from "./components/layout/Layout";
import UnitAvailability from "./components/projects/UnitAvailability";
import PropertiesManagement from "./components/properties/PropertiesManagement";
import CreatePropertyForm from "./components/properties/CreatePropertyForm";
import ListingLeads from "./components/leads/ListingLeads";
import LeadDetailsPage from "./components/leads/LeadDetailsPage";
import Settings from "./pages/Settings";
import Task from "./pages/Task";
import FollowUp from "./pages/FollowUp";
import UserManagement from "./components/settings/UserManagement";
import Billing from "./components/settings/Billing";
import LeadSettings from "./components/settings/LeadSettings";
import Imports from "./components/settings/Imports";
import NotificationSettings from "./components/settings/NotificationSettings";
import CustomFields from "./components/settings/CustomFields";
import CompanyDetails from "./components/settings/CompanyDetails";
import BrandRegistration from "./components/settings/BrandRegistration";
import ReassignmentLeads from "./components/settings/ReassignmentLeads";
import Goals from "./components/settings/Goals";
import Download from "./components/settings/Download";
import RolesandResponse from "./components/settings/RolesandResponse";
import LeadType from "./components/settings/LeadType";
import DocumentMng from "./components/settings/DocumentMng";
import ListingUnits from "./components/projects/units/ListingUnits";
import ChatHome from "./pages/ChatHome";
import Report from "./pages/Report";
import ForgotPassword from "./pages/ForgotPassword";
import { SocketProvider } from "./contexts/SocketContext";
import ProjectSetup from "./components/projects/setup/ProjectSetup";
import Quotations from "./pages/Quotations";
import ProjectQuotations from "./pages/ProjectQuotations";
import QuotationView from "./pages/QuotationView";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <LeadsProvider>
      <BrandProvider>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <AuthenticatedRedirect /> : <Login />
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            isAuthenticated ? <AuthenticatedRedirect /> : <Login />
          }
        />
        <Route
          path="/onboarding/company"
          element={<Navigate to="/onboarding/step1" replace />}
        />
        <Route
          path="/onboarding/brand"
          element={<Navigate to="/onboarding/step2" replace />}
        />
        <Route
          path="/onboarding/*"
          element={
            <ProtectedRoute skipOnboarding>
              <OnboardingWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-setup"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectSetup />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <Quotations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/:projectId"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <ProjectQuotations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/:projectId/quotation/:id"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <QuotationView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties"
          element={
            <ProtectedRoute requiredPermission="manage_project">
              <Layout>
                <PropertiesManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/create"
          element={
            <ProtectedRoute requiredPermission="create_projects">
              <Layout>
                <CreatePropertyForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute requiredPermission="view_leads">
              <Layout>
                <ListingLeads />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads/:id"
          element={
            <ProtectedRoute requiredPermission="view_leads">
              <Layout>
                <LeadDetailsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <ListingProject />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatHome />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/units"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <ListingUnits />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/list"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <ListingProject />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/list"
          element={
            <ProtectedRoute requiredPermission="manage_users">
              <Layout>
                <ListingUser />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/followups"
          element={
            <ProtectedRoute requiredPermission="view_followups">
              <Layout>
                <FollowUp />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="manage_users">
              <Layout>
                <ListingUser />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/userslisting"
          element={
            <ProtectedRoute requiredPermission="manage_users">
              <ListingUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredPermission="view_reports">
              <Layout>
                <Report />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute requiredPermission="view_tasks">
              <Layout>
                <Task />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/user-management"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/roles-and-responsibilities"
          element={
            <ProtectedRoute requiredPermission="view_roles">
              <Layout>
                <RolesandResponse />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/lead-types"
          element={
            <ProtectedRoute requiredPermission="manage_lead_types">
              <Layout>
                <LeadType />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/billing"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <Billing />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/lead-settings"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <LeadSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/import"
          element={
            <ProtectedRoute requiredPermission="import_leads">
              <Layout>
                <Imports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/download"
          element={
            <ProtectedRoute requiredPermission="export_leads">
              <Layout>
                <Download />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/document-management"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <DocumentMng />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/notification-settings"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <NotificationSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/custom-fields"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <CustomFields />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/company-details"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <CompanyDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/brand-registration"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <BrandRegistration />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/goals"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <Goals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/reassignment-leads"
          element={
            <ProtectedRoute requiredPermission="view_settings">
              <Layout>
                <ReassignmentLeads />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/create/*"
          element={
            <ProtectedRoute requiredPermission="create_projects">
              <Layout>
                <CreateProject />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/edit/:projectId/*"
          element={
            <ProtectedRoute requiredPermission="edit_projects">
              <Layout>
                <EditProject />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/availability"
          element={
            <ProtectedRoute requiredPermission="view_projects">
              <Layout>
                <UnitAvailability />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/edit/:id"
          element={
            <ProtectedRoute requiredPermission="edit_projects">
              <Layout>
                <EditProjectForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projectmanagement"
          element={
            <ProtectedRoute requiredPermission="manage_project">
              <Layout>
                <ProjectManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrandProvider>
    </LeadsProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <AppRoutes />
              <SecurityMonitor />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
