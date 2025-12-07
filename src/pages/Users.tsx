import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
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
import { UserPlus, Users, Loader2, Crown, Power, PowerOff, Eye, EyeOff } from "lucide-react";
import { createUserSchema } from "@/lib/validation";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { planType, userLimit: subscriptionUserLimit } = useSubscription();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  const [userRole, setUserRole] = useState<"gestor" | "vendedor">("vendedor");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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

  const { data: currentUserRole } = useQuery({
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

  const isOwner = currentUserRole === "gestor_owner";
  const canManageUsers = isOwner || currentUserRole === "gestor";
  const isIndividualPlan = planType?.includes('individual') || planType === 'free';

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

      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

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
  const effectiveUserLimit = subscriptionUserLimit || 10;
  const canCreateUser = !isIndividualPlan && additionalUsers < effectiveUserLimit;

  const createUserMutation = useMutation({
    mutationFn: async ({ name, email, password, role }: { 
      name: string; 
      email: string; 
      password: string; 
      role: string 
    }) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { name, email, password, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Usuário criado!",
        description: `${data.user?.name} foi adicionado à equipe.`,
      });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Create user error:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário. Tente novamente.",
        variant: "destructive",
      });
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

  const resetForm = () => {
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserPasswordConfirm("");
    setUserRole("vendedor");
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  const handleCreateUser = async () => {
    // Validate passwords match
    if (userPassword !== userPasswordConfirm) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    // Validate with Zod
    try {
      createUserSchema.parse({ 
        name: userName, 
        email: userEmail, 
        password: userPassword, 
        role: userRole 
      });
    } catch (error: any) {
      toast({
        title: "Dados inválidos",
        description: error.errors?.[0]?.message || "Verifique os dados informados",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({ 
      name: userName, 
      email: userEmail, 
      password: userPassword, 
      role: userRole 
    });
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
            {isIndividualPlan 
              ? "Plano Individual: 1 usuário" 
              : `${additionalUsers + 1}/${effectiveUserLimit} usuários`
            }
          </p>
        </div>
        
        {isOwner && !isIndividualPlan && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={!canCreateUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar novo usuário</DialogTitle>
                <DialogDescription>
                  {canCreateUser 
                    ? "Preencha os dados do novo membro da equipe." 
                    : `Limite de ${effectiveUserLimit} usuários atingido.`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input
                    id="user-name"
                    placeholder="Nome completo"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    placeholder="email@exemplo.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="user-password"
                      placeholder="Mínimo 12 caracteres"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 12 caracteres, incluindo maiúscula, minúscula, número e caractere especial.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password-confirm">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="user-password-confirm"
                      placeholder="Repita a senha"
                      value={userPasswordConfirm}
                      onChange={(e) => setUserPasswordConfirm(e.target.value)}
                      type={showPasswordConfirm ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-role">Função</Label>
                  <Select value={userRole} onValueChange={(v) => setUserRole(v as any)}>
                    <SelectTrigger id="user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Gestores visualizam todos os dados. Vendedores apenas seus próprios leads.
                  </p>
                </div>

                <Button 
                  onClick={handleCreateUser} 
                  className="w-full" 
                  disabled={!userName || !userEmail || !userPassword || !userPasswordConfirm || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários da Equipe
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
    </div>
  );
}
