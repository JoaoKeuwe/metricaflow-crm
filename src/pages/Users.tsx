import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Trash2, Users, Clock, CheckCircle, XCircle, Loader2, Crown, Mail, Power, PowerOff } from "lucide-react";
import { inviteSchema } from "@/lib/validation";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"gestor" | "vendedor">("vendedor");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  /**
   * UI-ONLY CHECK - Does not provide security!
   * Backend validation via RLS policies is required.
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

  const isOwner = userRole === "gestor_owner";
  const canManageUsers = isOwner || userRole === "gestor";

  const { data: users } = useQuery({
    queryKey: ["company-users", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, created_at, company_id, active, avatar_url")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true });

      if (profilesError) throw profilesError;

      // Get roles from user_roles table
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      return profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      })) || [];
    },
    enabled: !!profile?.company_id && canManageUsers,
  });

  const ownerCount = users?.filter(u => 
    u.user_roles?.some((r: any) => r.role === "gestor_owner")
  ).length || 0;
  const additionalUsers = (users?.length || 0) - ownerCount;
  const userLimit = profile?.companies?.user_limit_adicionais || 10;
  const canInvite = additionalUsers < userLimit;

  const { data: invites } = useQuery({
    queryKey: ["invites", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id && canManageUsers,
  });

  const createInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!profile?.company_id || !session?.user?.id) throw new Error("Not authenticated");
      
      // Create invite in database
      const { data: invite, error } = await supabase
        .from("invites")
        .insert([{
          email,
          company_id: profile.company_id,
          invited_by: session.user.id,
          role: role as any,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send invite email via edge function
      console.log("📧 Enviando email de convite via edge function...", {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        companyName: profile.companies?.name || "sua empresa",
      });

      const { data: emailData, error: emailError } = await supabase.functions.invoke("send-invite", {
        body: {
          inviteId: invite.id,
          email: invite.email,
          role: invite.role,
          companyName: profile.companies?.name || "sua empresa",
          appUrl: window.location.origin,
        },
      });

      console.log("📬 Resposta da edge function:", { emailData, emailError });

      if (emailError) {
        console.error("❌ Error sending invite email:", emailError);
        throw new Error(`Erro ao enviar e-mail: ${emailError.message}`);
      }

      if (emailData?.error) {
        console.error("❌ Send invite data error:", emailData);
        
        // Erro de configuração do Resend
        if (emailData.details) {
          throw new Error(`Configuração de email: ${emailData.details}`);
        }
        
        throw new Error(`Erro no envio: ${emailData.error}`);
      }

      console.log("✅ Email enviado com sucesso!");

      return invite;
    },
    onSuccess: () => {
      toast({
        title: "✅ Convite enviado!",
        description: `Um email de convite foi enviado para ${inviteEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      setInviteEmail("");
      setInviteRole("vendedor");
      setDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Invite error:", error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Não foi possível enviar o convite. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Convite cancelado" });
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ active })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      toast({
        title: active ? "Usuário ativado" : "Usuário desativado",
      });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status do usuário",
        variant: "destructive",
      });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel("users-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `company_id=eq.${profile.company_id}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["company-users"] })
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        () => queryClient.invalidateQueries({ queryKey: ["company-users"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id, queryClient]);

  const handleInvite = async () => {
    // Validação com Zod
    try {
      inviteSchema.parse({ email: inviteEmail, role: inviteRole });
    } catch (error: any) {
      toast({
        title: "Dados inválidos",
        description: error.errors?.[0]?.message || "Verifique os dados informados",
        variant: "destructive",
      });
      return;
    }

    createInviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      gestor_owner: { label: "Proprietário", variant: "default" },
      gestor: { label: "Gestor", variant: "secondary" },
      vendedor: { label: "Vendedor", variant: "outline" },
    };
    const config = roleMap[role] || { label: role, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInviteStatusBadge = (status: string, expiresAt: string) => {
    const expired = new Date(expiresAt) < new Date();
    
    if (expired) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
    }
    
    const statusMap: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "outline" }> = {
      pending: { label: "Pendente", icon: Clock, variant: "secondary" },
      accepted: { label: "Aceito", icon: CheckCircle, variant: "default" },
    };
    
    const config = statusMap[status] || { label: status, icon: Mail, variant: "outline" as const };
    const Icon = config.icon;
    
    return <Badge variant={config.variant}><Icon className="h-3 w-3 mr-1" />{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Apply role filter
  const filteredUsers = roleFilter !== "all"
    ? users?.filter(u => u.user_roles?.some((r: any) => r.role === roleFilter))
    : users;

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você não tem permissão para gerenciar usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestão de Usuários</h2>
          <p className="text-muted-foreground">
            {additionalUsers}/{userLimit} usuários adicionais
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canInvite}>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar novo usuário</DialogTitle>
              <DialogDescription>
                {canInvite ? "Digite o e-mail e selecione o perfil." : `Limite atingido (${userLimit})`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Função</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleInvite} 
                className="w-full" 
                disabled={!inviteEmail || createInviteMutation.isPending}
              >
                {createInviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar convite"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center mb-4">
        <Label>Filtrar por perfil:</Label>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="gestor_owner">Proprietário</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="vendedor">Vendedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
          <TabsTrigger value="invites">
            Convites 
            {invites && invites.length > 0 && (
              <Badge variant="secondary" className="ml-2">{invites.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    {isOwner && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const role = user.user_roles?.[0]?.role || "vendedor";
                    const isUserOwner = role === "gestor_owner";
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button 
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload de Avatar</DialogTitle>
                                <DialogDescription>
                                  Clique para fazer upload de uma nova foto de perfil
                                </DialogDescription>
                              </DialogHeader>
                              <AvatarUpload 
                                userId={user.id} 
                                currentAvatarUrl={user.avatar_url} 
                                userName={user.name} 
                              />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.name}
                          {isUserOwner && <Crown className="inline ml-2 h-4 w-4 text-yellow-500" />}
                        </TableCell>
                        <TableCell>{getRoleBadge(role)}</TableCell>
                        <TableCell>
                          <Badge variant={user.active ? "default" : "secondary"}>
                            {user.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        {isOwner && (
                          <TableCell>
                            {!isUserOwner && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleUserActiveMutation.mutate({
                                  userId: user.id,
                                  active: !user.active,
                                })}
                                disabled={toggleUserActiveMutation.isPending}
                              >
                                {user.active ? (
                                  <PowerOff className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Convites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invites && invites.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            {invite.email}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(invite.role)}</TableCell>
                        <TableCell>{getInviteStatusBadge(invite.status, invite.expires_at)}</TableCell>
                        <TableCell>
                          {new Date(invite.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {invite.status === "pending" && isOwner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteInviteMutation.mutate(invite.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum convite pendente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
