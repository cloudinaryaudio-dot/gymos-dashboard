import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { seedDemoData } from '@/utils/seedDemoData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, Database } from 'lucide-react';

export default function SeedDataPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await seedDemoData(user.id);
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Failed to seed data');
    } finally {
      setLoading(false);
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
          <CardTitle className="text-2xl">Seed Demo Data</CardTitle>
          <CardDescription>
            Populate your GymOS instance with realistic demo data including plans, members, payments, expenses, leads, trainers, testimonials, and gallery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-primary" />
              <p className="text-lg font-semibold text-foreground">Demo data loaded successfully!</p>
              <p className="text-sm text-muted-foreground">3 plans, 20 members, 20 payments, 10 expenses, 12 leads, 4 trainers, 6 testimonials, 10 gallery images</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/app/dashboard')}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => navigate('/')}>View Website</Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-sm text-muted-foreground">⚠️ This will insert demo data. Run only once on a fresh database.</p>
              <Button onClick={handleSeed} disabled={loading} size="lg" className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</> : 'Load Demo Data'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
