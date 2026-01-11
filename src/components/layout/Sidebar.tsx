import { LayoutDashboard, Users, KanbanSquare, Settings, LogOut, Plug, Calendar, ListTodo, Trophy, HelpCircle, ChevronLeft, ChevronRight, Shield, BarChart3 } from "lucide-react";
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
        .select("*, company:companies(*), is_super_admin")
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
  const isSuperAdmin = profile?.is_super_admin === true;

  const allNavItems = [{
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/leads",
    icon: Users,
    label: "Leads",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/kanban",
    icon: KanbanSquare,
    label: "Kanban",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/agenda",
    icon: Calendar,
    label: "Agenda",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/tasks",
    icon: ListTodo,
    label: "Tarefas",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/kpi",
    icon: BarChart3,
    label: "Desempenho & KPI",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/users",
    icon: Settings,
    label: "Gestão de Usuários",
    requiresOwnerOrGestor: true,
    requiresSuperAdmin: false
  }, {
    to: "/integrations",
    icon: Plug,
    label: "Integrações",
    requiresOwnerOrGestor: true,
    requiresSuperAdmin: false
  }, {
    to: "/gamification",
    icon: Trophy,
    label: "🎮 Gamificação Live",
    requiresOwnerOrGestor: true,
    requiresSuperAdmin: false
  }, {
    to: "/settings",
    icon: Settings,
    label: "Configurações",
    requiresOwnerOrGestor: true,
    requiresSuperAdmin: false
  }, {
    to: "/help",
    icon: HelpCircle,
    label: "Ajuda",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: false
  }, {
    to: "/admin",
    icon: Shield,
    label: "Administração",
    requiresOwnerOrGestor: false,
    requiresSuperAdmin: true
  }];

  const navItems = allNavItems.filter(item => {
    if (item.requiresSuperAdmin) return isSuperAdmin;
    if (item.requiresOwnerOrGestor) return isOwnerOrGestor;
    return true;
  });
  return <nav className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {profile?.company?.logo_url ? (
            <img 
              src={profile.company.logo_url} 
              alt={profile.company.name || "Logo"} 
              className="h-8 w-auto object-contain"
            />
          ) : (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {profile?.company?.system_name || "Pro"}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          {navItems.map(item => <NavLink 
            key={item.to} 
            to={item.to} 
            className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>)}
        </div>
      </div>

      <Button 
        variant="ghost" 
        className="gap-2" 
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </nav>
};

export default Sidebar;