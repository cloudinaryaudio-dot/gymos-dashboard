import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BrandingProvider } from "./components/BrandingProvider";
import LandingPage from "./pages/LandingPage";
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
import GalleryPage from "./pages/GalleryPage";
import MemberProfilePage from "./pages/MemberProfilePage";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <BrandingProvider>
      <DashboardLayout>
        <Routes>
          <Route index element={<PlaceholderPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="members/:memberId" element={<MemberProfilePage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="website" element={<WebsiteBuilderPage />} />
          <Route path="contact" element={<ContactSettingsPage />} />
          <Route path="settings" element={<BrandingSettingsPage />} />
        </Routes>
      </DashboardLayout>
    </BrandingProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/app/*" element={<AppLayout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
