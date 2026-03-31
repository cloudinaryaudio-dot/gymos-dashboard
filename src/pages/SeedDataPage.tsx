import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { seedDemoData, resetDemoData } from '@/utils/seedDemoData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, Database, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

export default function SeedDataPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 12 + 3;
      });
    }, 200);
    return () => { clearInterval(interval); setProgress(100); };
  };

  const handleSeed = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setDone(false);
    setResetDone(false);
    const finish = simulateProgress();
    try {
      await seedDemoData(user.id, { reset: true });
      finish();
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    setError('');
    setDone(false);
    setResetDone(false);
    try {
      await resetDemoData(user.id);
      setResetDone(true);
    } catch (e: any) {
      setError(e.message || 'Failed to reset data');
    } finally {
      setResetting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in first to seed demo data.</p>
            <Button className="mt-4" onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Database className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl">Demo Data Manager</CardTitle>
          <CardDescription>
            Generate or reset realistic demo data — plans, members, payments, expenses, leads, trainers, testimonials, gallery, website content, and contact settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-primary" />
              <p className="text-lg font-semibold text-foreground">Demo data generated successfully! 🎉</p>
              <p className="text-sm text-muted-foreground">
                3 plans, 25 members, 25 payments, 12 expenses, 18 leads, 4 trainers, 6 testimonials, 12 gallery images, full website content & contact settings
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => navigate('/app/dashboard')}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => navigate('/')}>View Website</Button>
                <Button variant="ghost" onClick={() => { setDone(false); setProgress(0); }}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Seed Again
                </Button>
              </div>
            </div>
          ) : resetDone ? (
            <div className="text-center space-y-4">
              <Trash2 className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">All data cleared!</p>
              <p className="text-sm text-muted-foreground">Your account is now clean. You can seed fresh data or start from scratch.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => { setResetDone(false); handleSeed(); }}>
                  <Database className="mr-2 h-4 w-4" /> Load Fresh Demo Data
                </Button>
                <Button variant="outline" onClick={() => navigate('/app/dashboard')}>Go to Dashboard</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              {(loading || resetting) && (
                <div className="space-y-2">
                  <Progress value={loading ? progress : undefined} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {loading ? 'Generating demo data...' : 'Clearing data...'}
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                ⚠️ Seeding will <strong>replace</strong> existing data (members, plans, payments, etc.) with fresh demo data. Your account and gym settings are preserved.
              </p>

              <div className="flex gap-3 justify-center flex-wrap">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="lg" disabled={loading || resetting}>
                      <Database className="mr-2 h-4 w-4" /> Generate Demo Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Generate Demo Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete existing data (members, plans, payments, expenses, leads, website content) and replace it with fresh realistic demo data. Your account and gym identity are preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSeed}>Yes, Generate</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="lg" disabled={loading || resetting}>
                      <Trash2 className="mr-2 h-4 w-4" /> Reset Only
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all members, plans, payments, expenses, leads, trainers, testimonials, gallery, and website content. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
