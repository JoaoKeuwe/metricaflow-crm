import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGamificationSettings() {
  return useQuery({
    queryKey: ["gamification-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) return null;

      const { data, error } = await supabase
        .from("gamification_settings")
        .select("*")
        .eq("company_id", profile.company_id);

      if (error) throw error;

      // Convert to map for easy access
      const settingsMap: Record<string, number> = {};
      data?.forEach((setting) => {
        settingsMap[setting.event_type] = setting.points;
      });

      return settingsMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
