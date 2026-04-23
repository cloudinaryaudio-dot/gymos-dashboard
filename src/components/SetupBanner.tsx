import { useState } from 'react';
import { useSetupDetection } from '@/hooks/useSetupDetection';
import { seedDemoData, resetDemoData } from '@/data/mockDb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Database, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function SetupBanner() {
  const { needsSetup, checking } = useSetupDetection();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  if (checking || !needsSetup || done) return null;

  const handleSeed = () => {
    setSeeding(true);
    try {
      console.log('[SetupBanner] Starting demo data load...');
      resetDemoData();
      const result = seedDemoData();

      // Validate
      if (result.members.length > 0 && result.plans.length > 0 && result.website_content) {
        console.log('[SetupBanner] ✅ Demo data loaded successfully');
        toast.success('Demo data loaded successfully');
        setDone(true);
        setTimeout(() => window.location.reload(), 500);
      } else {
        console.error('[SetupBanner] ❌ Demo data load failed — validation failed');
        toast.error('Demo data load failed');
        setSeeding(false);
      }
    } catch (e) {
      console.error('[SetupBanner] ❌ Error loading demo data:', e);
      toast.error('Demo data load failed');
      setSeeding(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Welcome to GymOS!</CardTitle>
        </div>
        <CardDescription>Your account is fresh. Get started by loading demo data or adding your own.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSeed} disabled={seeding} size="sm">
          {seeding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : <><Database className="mr-2 h-4 w-4" /> Load Demo Data</>}
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/members')}>
          <ArrowRight className="mr-2 h-4 w-4" /> Start from Scratch
        </Button>
      </CardContent>
    </Card>
  );
}
