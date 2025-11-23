import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para gerenciar atualizações em tempo real de leads
 * Compartilha um único listener entre todos os componentes
 * @param specificQueryKey - Query key específica para invalidação seletiva (opcional)
 */
export function useRealtimeLeads(specificQueryKey?: any[]) {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          
          // Debounce de 500ms para agrupar múltiplas mudanças
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(() => {
            // Invalidação seletiva se queryKey específica foi fornecida
            if (specificQueryKey) {
              queryClient.invalidateQueries({ queryKey: specificQueryKey });
              queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            } else {
              // Invalidação global como fallback
              queryClient.invalidateQueries({ queryKey: ['leads'] });
              queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            }
            
            // Sempre invalidar kanban e dashboard
            queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }, 500);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime listener');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [queryClient, specificQueryKey]);
}
