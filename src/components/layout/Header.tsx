import { Bell, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MeetingNotifications from "./MeetingNotifications";

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
        .in(
          "user_id",
          (profiles || []).map((p) => p.id)
        );

      const ownerCount = owners?.length || 0;
      return (profiles?.length || 0) - ownerCount;
    },
    enabled: !!profile?.company_id,
  });

  const { data: tasks } = useQuery({
    queryKey: ["header-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, assigned_profile:profiles!tasks_assigned_to_fkey(name), lead:leads(name)")
        .in("status", ["aberta", "em_andamento"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  const { data: pendingMeetings } = useQuery({
    queryKey: ["pending-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*, lead:leads(name)")
        .eq("feedback_collected", false)
        .eq("status", "agendada")
        .lt("end_time", new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order("end_time", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
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
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Bem-vindo(a), {profile?.name || session?.user?.email?.split('@')[0] || 'Usuário'}
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

        <MeetingNotifications />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {((tasks?.length || 0) + (pendingMeetings?.length || 0)) > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {(tasks?.length || 0) + (pendingMeetings?.length || 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 z-50 bg-popover" align="end">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tasks">Tarefas {tasks && tasks.length > 0 && `(${tasks.length})`}</TabsTrigger>
                <TabsTrigger value="meetings">Reuniões {pendingMeetings && pendingMeetings.length > 0 && `(${pendingMeetings.length})`}</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                {tasks && tasks.length > 0 ? tasks.map((task: any) => (
                  <div key={task.id} className="p-3 bg-muted rounded-lg space-y-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.due_date && <p className="text-xs text-muted-foreground">Prazo: {format(new Date(task.due_date), "dd/MM/yyyy")}</p>}
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>}
              </TabsContent>
              <TabsContent value="meetings" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
                {pendingMeetings && pendingMeetings.length > 0 ? pendingMeetings.map((meeting: any) => (
                  <div key={meeting.id} className="p-3 bg-muted rounded-lg space-y-1">
                    <p className="font-medium text-sm">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">Encerrada: {format(new Date(meeting.end_time), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhum feedback pendente</p>}
              </TabsContent>
            </Tabs>
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
