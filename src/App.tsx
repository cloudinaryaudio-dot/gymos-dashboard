import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MembersPage from "./pages/MembersPage";
import PlansPage from "./pages/PlansPage";
import PaymentsPage from "./pages/PaymentsPage";
import ExpensesPage from "./pages/ExpensesPage";
import LeadsPage from "./pages/LeadsPage";
import WebsiteBuilderPage from "./pages/WebsiteBuilderPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import BrandingSettingsPage from "./pages/BrandingSettingsPage";
import ContactSettingsPage from "./pages/ContactSettingsPage";
import NotFound from "./pages/NotFound";
import SeedDataPage from "./pages/SeedDataPage";
import GalleryPage from "./pages/GalleryPage";
import MemberProfilePage from "./pages/MemberProfilePage";
import { BrandingProvider } from "./components/BrandingProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/seed" element={<SeedDataPage />} />

            {/* Protected admin routes */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route index element={<BrandingProvider><PlaceholderPage /></BrandingProvider>} />
              <Route path="dashboard" element={<BrandingProvider><Dashboard /></BrandingProvider>} />
              <Route path="members" element={<BrandingProvider><MembersPage /></BrandingProvider>} />
              <Route path="members/:memberId" element={<BrandingProvider><MemberProfilePage /></BrandingProvider>} />
              <Route path="plans" element={<BrandingProvider><PlansPage /></BrandingProvider>} />
              <Route path="payments" element={<BrandingProvider><PaymentsPage /></BrandingProvider>} />
              <Route path="leads" element={<BrandingProvider><LeadsPage /></BrandingProvider>} />
              <Route path="expenses" element={<BrandingProvider><ExpensesPage /></BrandingProvider>} />
              <Route path="website" element={<BrandingProvider><WebsiteBuilderPage /></BrandingProvider>} />
              <Route path="contact" element={<BrandingProvider><ContactSettingsPage /></BrandingProvider>} />
              <Route path="settings" element={<BrandingProvider><BrandingSettingsPage /></BrandingProvider>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
