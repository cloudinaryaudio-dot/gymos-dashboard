import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { db } from '@/integrations/supabase/db';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  gymId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  gymId: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGymId = async (userId: string) => {
    try {
      const { data, error } = await db
        .from('profiles')
        .select('gym_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.gym_id) {
        setGymId(data.gym_id);
      }
    } catch (err) {
      console.error('Error fetching gym_id:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => fetchGymId(session.user.id), 0);
      } else {
        setGymId(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchGymId(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setGymId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, gymId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
