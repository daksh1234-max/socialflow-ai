import { useEffect } from 'react';
import { supabase } from '@/src/services/supabase/client';
import { useAuthStore, Profile } from '@/src/stores/authStore';

export function useAuth() {
  const { session, user, profile, isInitialized, setSession, setInitialized, setProfile } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfile(data as Profile);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, profile, isInitialized };
}
