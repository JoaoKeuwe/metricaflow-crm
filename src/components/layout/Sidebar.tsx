import { LayoutDashboard, Users, KanbanSquare, UserCog, Settings, LogOut, Plug, Calendar, ListTodo, Database, Upload, MessageCircle, Trophy } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
const Sidebar = () => {
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

  const { data: userRole } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .order("role")
        .limit(1)
        .single();
      return data?.role;
    },
    enabled: !!session?.user?.id,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado com sucesso"
    });
    navigate("/auth");
  };

  const isOwnerOrGestor = userRole === 'gestor_owner' || userRole === 'gestor';

  const allNavItems = [{
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    requiresOwnerOrGestor: false
  }, {
    to: "/leads",
    icon: Users,
    label: "Leads",
    requiresOwnerOrGestor: false
  }, {
    to: "/kanban",
    icon: KanbanSquare,
    label: "Kanban",
    requiresOwnerOrGestor: false
  }, {
    to: "/agenda",
    icon: Calendar,
    label: "Agenda",
    requiresOwnerOrGestor: false
  }, {
    to: "/tasks",
    icon: ListTodo,
    label: "Tarefas",
    requiresOwnerOrGestor: false
  }, {
    to: "/local-prospector",
    icon: Database,
    label: "Local Prospector",
    requiresOwnerOrGestor: false
  }, {
    to: "/user-management",
    icon: Settings,
    label: "Gestão de Usuários",
    requiresOwnerOrGestor: true
  }, {
    to: "/integrations",
    icon: Plug,
    label: "Integrações",
    requiresOwnerOrGestor: true
  }, {
    to: "/gamification",
    icon: Trophy,
    label: "🎮 Gamificação Live",
    requiresOwnerOrGestor: true
  }];

  const navItems = allNavItems.filter(item => !item.requiresOwnerOrGestor || isOwnerOrGestor);
  return <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Pro</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => <NavLink key={item.to} to={item.to} className={({
        isActive
      }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>)}
      </nav>

      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>;
};
export default Sidebar;