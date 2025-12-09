import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanySettings from "@/components/company/CompanySettings";
import DemoDataSettings from "@/components/company/DemoDataSettings";
import { GamificationSettings } from "@/components/gamification/GamificationSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { SalesManualSettings } from "@/components/settings/SalesManualSettings";
import { Building2, User, Database, Trophy, CreditCard, CheckCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("company");

  // Check if user is gestor/owner
  const { data: userRole } = useQuery({
    queryKey: ["user-role-settings"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_role");
      return data;
    },
  });

  const canEditSalesManual = userRole === "gestor" || userRole === "gestor_owner";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
    
    const success = searchParams.get("success");
    if (success === "true") {
      toast.success("Assinatura ativada com sucesso!", {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Assinatura
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Gamificação
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Dados Demo
          </TabsTrigger>
          {canEditSalesManual && (
            <TabsTrigger value="sales-manual" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Manual de Vendas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="text-muted-foreground">
            Configurações de perfil em desenvolvimento...
          </div>
        </TabsContent>

        <TabsContent value="gamification" className="mt-6">
          <GamificationSettings />
        </TabsContent>

        <TabsContent value="demo" className="mt-6">
          <DemoDataSettings />
        </TabsContent>

        {canEditSalesManual && (
          <TabsContent value="sales-manual" className="mt-6">
            <SalesManualSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;