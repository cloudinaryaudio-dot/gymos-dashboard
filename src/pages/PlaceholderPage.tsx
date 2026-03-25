import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Construction } from 'lucide-react';

export default function PlaceholderPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const pageName = location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold font-display">{pageName}</h1>
        <p className="text-muted-foreground mt-2">This section is under construction.</p>
      </div>
    </DashboardLayout>
  );
}
