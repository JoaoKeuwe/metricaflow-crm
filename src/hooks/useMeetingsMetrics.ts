import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DateRange {
  start: string;
  end: string;
}

interface MeetingMetrics {
  userId: string;
  userName: string;
  avatarUrl?: string;
  scheduledMeetings: number;
  completedMeetings: number;
}

export const useMeetingsMetrics = (dateRange: DateRange, userRole?: string) => {
  return useQuery({
    queryKey: ["meetings-metrics", dateRange, userRole],
    queryFn: async () => {
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_participants(
            user_id,
            profiles(name, avatar_url)
          )
        `)
        .gte('start_time', dateRange.start)
        .lte('start_time', dateRange.end);

      if (error) throw error;

      // Processar métricas por usuário
      const metricsByUser: Record<string, MeetingMetrics> = {};
      
      meetings?.forEach(meeting => {
        meeting.meeting_participants?.forEach((participant: any) => {
          const userId = participant.user_id;
          const userName = participant.profiles?.name || 'Desconhecido';
          const avatarUrl = participant.profiles?.avatar_url;

          if (!metricsByUser[userId]) {
            metricsByUser[userId] = {
              userId,
              userName,
              avatarUrl,
              scheduledMeetings: 0,
              completedMeetings: 0,
            };
          }

          if (meeting.status !== 'cancelada') {
            metricsByUser[userId].scheduledMeetings += 1;
          }
          
          if (meeting.status === 'realizada') {
            metricsByUser[userId].completedMeetings += 1;
          }
        });
      });

      return Object.values(metricsByUser);
    },
    enabled: !!userRole && userRole !== 'vendedor',
  });
};
