import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Settings, Building2, Users, CreditCard, FileText, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminCompaniesTable } from "@/components/admin/AdminCompaniesTable";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminSubscriptionsTable } from "@/components/admin/AdminSubscriptionsTable";
import { AdminInvoicesTable } from "@/components/admin/AdminInvoicesTable";
import { useIsSuperAdmin } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: isSuperAdmin, isLoading } = useIsSuperAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel de Administração</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie empresas, usuários, assinaturas e visualize dados do Stripe
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card/50 border border-border/30 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="companies"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Empresas
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <FileText className="h-4 w-4 mr-2" />
              Faturas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="companies" className="mt-4">
            <AdminCompaniesTable />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <AdminUsersTable />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <AdminSubscriptionsTable />
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <AdminInvoicesTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
