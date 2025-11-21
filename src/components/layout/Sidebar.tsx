import { LayoutDashboard, Users, KanbanSquare, Settings, LogOut, Plug, Calendar, ListTodo, Bell, Database, Trophy, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

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
        .select("*, company:companies(*)")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  /**
   * UI-ONLY CHECK - Does not provide security!
   * This role check is for UX optimization only.
   * Actual security is enforced by:
   * - Backend RLS policies
   * - Edge Function authentication
   * - Database SECURITY DEFINER functions
   */
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

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado com sucesso"
    });
    navigate("/auth");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isOwnerOrGestor = (profile?.company?.owner_id === session?.user?.id) || userRole === 'gestor_owner' || userRole === 'gestor';

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
    to: "/reminders",
    icon: Bell,
    label: "Lembretes",
    requiresOwnerOrGestor: false
  }, {
    to: "/local-prospector",
    icon: Database,
    label: "Local Prospector",
    requiresOwnerOrGestor: false
  }, {
    to: "/users",
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
  }, {
    to: "/settings",
    icon: Settings,
    label: "Configurações",
    requiresOwnerOrGestor: true
  }, {
    to: "/help",
    icon: HelpCircle,
    label: "Ajuda",
    requiresOwnerOrGestor: false
  }];

  const navItems = allNavItems.filter(item => !item.requiresOwnerOrGestor || isOwnerOrGestor);
  return <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col sticky top-0 h-screen z-30 min-h-0 transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-b border-border flex items-center justify-center relative`}>
        {!isCollapsed && (
          <>
            {profile?.company?.logo_url ? (
              <img 
                src={profile.company.logo_url} 
                alt={profile.company.name || "Logo"} 
                className="h-12 w-auto object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {profile?.company?.system_name || "Pro"}
              </h1>
            )}
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={`${isCollapsed ? 'relative' : 'absolute right-2'} hover:bg-muted`}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className={`flex-1 min-h-0 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'} space-y-2`}>
        {navItems.map(item => <NavLink 
          key={item.to} 
          to={item.to} 
          className={({isActive}) => `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-all ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          title={isCollapsed ? item.label : undefined}
        >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>)}
      </nav>

      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-border`}>
        <Button 
          variant="ghost" 
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-3'}`} 
          onClick={handleLogout}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && "Sair"}
        </Button>
      </div>
    </aside>;
};
export default Sidebar;