import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanySettings from "@/components/company/CompanySettings";
import { Building2, User } from "lucide-react";

const Settings = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="text-muted-foreground">
            Configurações de perfil em desenvolvimento...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;