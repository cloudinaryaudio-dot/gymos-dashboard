import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell } from 'lucide-react';

export default function Auth() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gymName, setGymName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/app/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Your email is not confirmed yet. Please check your inbox or sign up again.');
          }
          throw error;
        }
        navigate('/app/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              gym_name: gymName || 'My Gym',
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          // Auto-confirmed: the DB trigger creates profile, but we need to create gym & link it
          const userId = data.user!.id;

          // Create gym
          const { data: gymData, error: gymErr } = await db
            .from('gyms')
            .insert({ name: gymName || 'My Gym' })
            .select('id')
            .single();

          if (gymErr) {
            console.error('Gym creation error:', gymErr);
          } else {
            // Update profile with gym_id and owner role
            await db
              .from('profiles')
              .update({ gym_id: gymData.id, role: 'owner' })
              .eq('user_id', userId);
          }

          navigate('/app/dashboard');
        } else {
          toast({
            title: 'Account created!',
            description: 'Please check your email to confirm your account, then sign in.',
          });
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-sidebar-accent-foreground">GymOS</h1>
        </div>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-sidebar-accent-foreground font-display text-xl">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription className="text-sidebar-foreground">
              {isLogin ? 'Sign in to manage your gym' : 'Get started with GymOS'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sidebar-foreground">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-sidebar border-sidebar-border text-sidebar-accent-foreground" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gymName" className="text-sidebar-foreground">Gym Name</Label>
                    <Input id="gymName" value={gymName} onChange={(e) => setGymName(e.target.value)} className="bg-sidebar border-sidebar-border text-sidebar-accent-foreground" placeholder="My Awesome Gym" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sidebar-foreground">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-sidebar border-sidebar-border text-sidebar-accent-foreground" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sidebar-foreground">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-sidebar border-sidebar-border text-sidebar-accent-foreground" placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
