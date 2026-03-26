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
import NotFound from "./pages/NotFound";

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

            {/* Protected admin routes */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="website" element={<WebsiteBuilderPage />} />
              <Route path="settings" element={<PlaceholderPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
