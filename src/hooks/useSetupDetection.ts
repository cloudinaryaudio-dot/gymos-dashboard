import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';

/**
 * Detects whether the current user has any data (plans, members, etc.)
 * Returns `needsSetup = true` if the account is fresh.
 */
export function useSetupDetection() {
  const { user } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const check = async () => {
      try {
        const { data, error } = await db
          .from('plans')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          console.error('Setup detection error:', error);
          setNeedsSetup(false);
        } else {
          setNeedsSetup(!data || data.length === 0);
        }
      } catch {
        setNeedsSetup(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user]);

  return { needsSetup, checking };
}
