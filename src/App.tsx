import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BrandingProvider } from "./components/BrandingProvider";
import LandingPage from "./pages/LandingPage";
import AnalyticsDashboardPage from "./pages/AnalyticsDashboardPage";
import MembersPage from "./pages/MembersPage";
import MembersDashboardPage from "./pages/MembersDashboardPage";
import PlansPage from "./pages/PlansPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentsDashboardPage from "./pages/PaymentsDashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import ExpensesDashboardPage from "./pages/ExpensesDashboardPage";
import LeadsPage from "./pages/LeadsPage";
import LeadsDashboardPage from "./pages/LeadsDashboardPage";
import WebsiteBuilderPage from "./pages/WebsiteBuilderPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import BrandingSettingsPage from "./pages/BrandingSettingsPage";
import ContactSettingsPage from "./pages/ContactSettingsPage";
import NotFound from "./pages/NotFound";
import GalleryPage from "./pages/GalleryPage";
import MemberProfilePage from "./pages/MemberProfilePage";
import PublicPlansPage from "./pages/PublicPlansPage";
import PublicBranchesPage from "./pages/PublicBranchesPage";
import PublicServicesPage from "./pages/PublicServicesPage";
import PublicTrainersPage from "./pages/PublicTrainersPage";
import PublicEquipmentPage from "./pages/PublicEquipmentPage";
import PublicTestimonialsPage from "./pages/PublicTestimonialsPage";
import PublicProductsPage from "./pages/PublicProductsPage";
import PublicProductDetailPage from "./pages/PublicProductDetailPage";
import OwnerSummaryPage from "./pages/OwnerSummaryPage";
import InvoiceSettingsPage from "./pages/InvoiceSettingsPage";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<PlaceholderPage />} />
        <Route path="dashboard" element={<AnalyticsDashboardPage />} />
        <Route path="owner-summary" element={<OwnerSummaryPage />} />
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/dashboard" element={<MembersDashboardPage />} />
        <Route path="members/:memberId" element={<MemberProfilePage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/dashboard" element={<PaymentsDashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/dashboard" element={<LeadsDashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expenses/dashboard" element={<ExpensesDashboardPage />} />
        <Route path="website" element={<WebsiteBuilderPage />} />
        <Route path="contact" element={<ContactSettingsPage />} />
        <Route path="settings" element={<BrandingSettingsPage />} />
        <Route path="settings/invoice" element={<InvoiceSettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <BrandingProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/plans" element={<PublicPlansPage />} />
            <Route path="/branches" element={<PublicBranchesPage />} />
            <Route path="/services" element={<PublicServicesPage />} />
            <Route path="/trainers" element={<PublicTrainersPage />} />
            <Route path="/equipment" element={<PublicEquipmentPage />} />
            <Route path="/testimonials" element={<PublicTestimonialsPage />} />
            <Route path="/products" element={<PublicProductsPage />} />
            <Route path="/products/:id" element={<PublicProductDetailPage />} />
            <Route path="/app/*" element={<AppLayout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrandingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
