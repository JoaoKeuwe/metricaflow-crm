import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeGamification() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    console.log('Setting up realtime gamification listener');

    const channel = supabase
      .channel('gamification-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead change detected for gamification:', payload.eventType);
          setLastUpdate(new Date());
          
          // Invalidar queries relacionadas
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-leaderboard'] });
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_observations'
        },
        () => {
          console.log('Observation change detected');
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['gamification-leaderboard'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up gamification realtime listener');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { lastUpdate };
}
