import { LayoutDashboard, Users, KanbanSquare, UserCog, Settings, LogOut, Plug } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
const Sidebar = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado com sucesso"
    });
    navigate("/auth");
  };
  const navItems = [{
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard"
  }, {
    to: "/leads",
    icon: Users,
    label: "Leads"
  }, {
    to: "/kanban",
    icon: KanbanSquare,
    label: "Kanban"
  }, {
    to: "/users",
    icon: UserCog,
    label: "Usuários"
  }, {
    to: "/user-management",
    icon: Settings,
    label: "Gestão de Usuários"
  }, {
    to: "/integrations",
    icon: Plug,
    label: "Integrações"
  }];
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