import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import WhatsAppButton from "@/components/support/WhatsAppButton";
import { useTheme } from "@/hooks/useTheme";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Apply theme on mount
  useTheme();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (!session) {
        setLoading(false);
        window.location.replace("/auth");
        return;
      }

      // Check if user must change password
      const { data: profile } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", session.user.id)
        .single();

      if (profile?.must_change_password) {
        setMustChangePassword(true);
        window.location.replace("/change-password");
        return;
      }

      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        window.location.replace("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || mustChangePassword) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pt-16">
        <main className="min-h-[calc(100vh-4rem)] overflow-y-auto p-6">{children}</main>
      </div>
      <OnboardingTour />
      <WhatsAppButton />
    </div>
  );
};

export default ProtectedRoute;
