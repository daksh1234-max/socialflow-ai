import { useEffect } from 'react';
import { supabase } from '@/src/services/supabase/client';
import { useAuthStore } from '@/src/stores/authStore';

export function useAuth() {
  const { session, user, isInitialized, setSession, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isInitialized };
}
