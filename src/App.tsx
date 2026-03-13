import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import UserDashboard from "@/pages/UserDashboard";
import UsersPage from "@/pages/UsersPage";
import WebsitesPage from "@/pages/WebsitesPage";
import ActivityLogsPage from "@/pages/ActivityLogsPage";
import SmtpSettingsPage from "@/pages/SmtpSettingsPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import PricingPage from "@/pages/PricingPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";
import LandingPage from "@/pages/LandingPage";
import WhyUsePage from "@/pages/WhyUsePage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import FaqPage from "@/pages/FaqPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            {/* User dashboard */}
            <Route path="/my-dashboard" element={
              <ProtectedRoute><UserDashboard /></ProtectedRoute>
            } />
            {/* Admin panel */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/websites" element={<WebsitesPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/activity-logs" element={<ActivityLogsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SmtpSettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
