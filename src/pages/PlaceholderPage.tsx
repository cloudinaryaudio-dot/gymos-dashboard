import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop() || 'Page';
  const displayName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Construction className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold font-display">{displayName}</h1>
      <p className="text-muted-foreground mt-2">This section is under construction.</p>
    </div>
  );
}
