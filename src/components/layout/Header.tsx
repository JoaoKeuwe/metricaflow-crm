import { Bell, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*, companies(*)")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: userCount } = useQuery({
    queryKey: ["user-count", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return 0;
      
      // Get all profiles for the company
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", profile.company_id);
      
      // Get owner count
      const { data: owners } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "gestor_owner")
        .in("user_id", (profiles || []).map(p => p.id));
      
      const ownerCount = owners?.length || 0;
      return (profiles?.length || 0) - ownerCount;
    },
    enabled: !!profile?.company_id,
  });

  const { data: reminders } = useQuery({
    queryKey: ["pending-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, leads(name)")
        .eq("completed", false)
        .lte("reminder_date", new Date().toISOString())
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/auth");
  };

  const userLimit = profile?.companies?.user_limit_adicionais || 10;

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Bem-vindo ao CRM
        </h2>
        <p className="text-sm text-muted-foreground">
          Gerencie seus leads e vendas
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Badge 
          variant="secondary" 
          className="cursor-pointer" 
          onClick={() => navigate("/users")}
        >
          <Users className="mr-2 h-4 w-4" />
          Usuários: {userCount}/{userLimit}
        </Badge>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {reminders && reminders.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Lembretes Pendentes</h3>
              {reminders && reminders.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {reminders.map((reminder: any) => (
                    <div
                      key={reminder.id}
                      className="p-3 bg-muted rounded-lg space-y-1"
                    >
                      <p className="text-sm font-medium">
                        {reminder.leads?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reminder.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reminder.reminder_date), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum lembrete pendente
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
