import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para gerenciar atualizações em tempo real de leads
 * Compartilha um único listener entre todos os componentes
 */
export function useRealtimeLeads() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime listener for leads');

    const channel = supabase
      .channel('leads-realtime-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Lead change detected:', payload.eventType);
          
          // Invalidar queries relacionadas com debounce
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
