import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSetupDetection } from '@/hooks/useSetupDetection';
import { seedDemoData, resetDemoData } from '@/utils/seedDemoData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Database, Loader2, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SetupBanner() {
  const { user } = useAuth();
  const { needsSetup, checking } = useSetupDetection();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (checking || !needsSetup || !user || done) return null;

  const handleSeed = async () => {
    setSeeding(true);
    setError('');
    try {
      await seedDemoData(user.id);
      setDone(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  if (done) {
    return (
      <Card className="border-primary/30 bg-primary/5 mb-6">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">Demo data loaded! Refreshing...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Welcome to GymOS!</CardTitle>
        </div>
        <CardDescription>
          Your account is fresh. Get started by loading demo data or adding your own.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSeed} disabled={seeding} size="sm">
          {seeding ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Demo Data...</>
          ) : (
            <><Database className="mr-2 h-4 w-4" /> Load Demo Data</>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/members')}>
          <ArrowRight className="mr-2 h-4 w-4" /> Start from Scratch
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
