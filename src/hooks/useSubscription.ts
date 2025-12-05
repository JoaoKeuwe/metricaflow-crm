import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPlanById } from "@/lib/stripe-plans";

interface SubscriptionData {
  subscribed: boolean;
  planType: string;
  userLimit: number;
  subscriptionEnd: string | null;
}

export const useSubscription = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionData> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          subscribed: false,
          planType: 'free',
          userLimit: 1,
          subscriptionEnd: null,
        };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const planDetails = data?.planType ? getPlanById(data.planType) : null;

  return {
    isLoading,
    error,
    refetch,
    subscribed: data?.subscribed ?? false,
    planType: data?.planType ?? 'free',
    userLimit: data?.userLimit ?? 1,
    subscriptionEnd: data?.subscriptionEnd ?? null,
    planDetails,
    isActive: data?.subscribed ?? false,
    isPremium: data?.planType?.includes('team') ?? false,
  };
};
