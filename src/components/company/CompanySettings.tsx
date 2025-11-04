import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload } from "lucide-react";
import ThemeSelector from "./ThemeSelector";

const CompanySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

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

  const { data: userRoles } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Check if user is owner (via company.owner_id) or has gestor/gestor_owner role
  const isOwnerOrGestor = 
    profile?.company?.owner_id === session?.user?.id || 
    userRoles?.some(ur => ur.role === "gestor_owner" || ur.role === "gestor");

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { system_name?: string; logo_url?: string }) => {
      if (!profile?.company_id) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", profile.company_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Configurações atualizadas!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.company_id) return;

    // Validação
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.company_id}-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await updateCompanyMutation.mutateAsync({ logo_url: publicUrl });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSystemNameChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const system_name = formData.get("system_name") as string;
    updateCompanyMutation.mutate({ system_name });
  };

  if (!isOwnerOrGestor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Empresa</CardTitle>
          <CardDescription>Apenas proprietários e gestores podem alterar essas configurações</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ThemeSelector />
      
      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
          <CardDescription>Personalize o sistema com a identidade visual da sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.company?.logo_url || undefined} />
              <AvatarFallback>
                <Building2 className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Clique para fazer upload"}
                </div>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: PNG ou JPG, máximo 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nome do Sistema</CardTitle>
          <CardDescription>Como o sistema aparecerá para seus usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSystemNameChange} className="space-y-4">
            <div>
              <Label htmlFor="system_name">Nome</Label>
              <Input
                id="system_name"
                name="system_name"
                defaultValue={profile?.company?.system_name || "CRM Sistema"}
                placeholder="Ex: Vendas Pro, Minha Empresa CRM"
              />
            </div>
            <Button type="submit" disabled={updateCompanyMutation.isPending}>
              {updateCompanyMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings;