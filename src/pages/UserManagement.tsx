import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Crown, Power, PowerOff } from "lucide-react";
import { createUserSchema } from "@/lib/validation";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "vendedor" as "gestor" | "vendedor",
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

  const { data: users, refetch } = useQuery({
    queryKey: ["company-users", profile?.company_id, roleFilter],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, created_at, company_id, active")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true });

      if (profilesError) throw profilesError;

      const userIds = profiles?.map((p) => p.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        user_roles: roles?.filter((r) => r.user_id === profile.id) || [],
      })) || [];

      // Apply role filter
      if (roleFilter !== "all") {
        return usersWithRoles.filter((u) =>
          u.user_roles.some((r: any) => r.role === roleFilter)
        );
      }

      return usersWithRoles;
    },
    enabled: !!profile?.company_id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel("user-management-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `company_id=eq.${profile.company_id}`,
        },
        () => {
          refetch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id, refetch]);

  const isOwner = userRole === "gestor_owner";
  const isGestor = userRole === "gestor";

  const activeAdditionalUsers =
    users?.filter(
      (u) =>
        u.active &&
        !u.user_roles?.some((r: any) => r.role === "gestor_owner")
    ).length || 0;
  const userLimit = profile?.companies?.user_limit_adicionais || 10;
  const canAddUser = activeAdditionalUsers < userLimit && isOwner;

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validate with zod
      const validated = createUserSchema.parse(data);

      // Verificar se o e-mail já existe na empresa antes de criar
      const { data: emailIsUnique } = await supabase.rpc('is_email_unique_in_company', {
        _email: validated.email,
        _company_id: profile?.company_id,
      });

      if (emailIsUnique === false) {
        throw new Error('EMAIL_EXISTS');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validated),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "vendedor",
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Traduzir mensagens de erro comuns
      if (error.message === 'EMAIL_EXISTS' || error.message.includes('already been registered')) {
        errorMessage = 'Este e-mail já está cadastrado. Por favor, use outro e-mail.';
      } else if (error.message.includes('User already exists')) {
        errorMessage = 'Este e-mail já está em uso. Por favor, use outro e-mail.';
      } else if (error.message.includes('limit') || error.message.includes('reached')) {
        errorMessage = 'Limite de usuários atingido. Aumente o limite para adicionar mais usuários.';
      } else if (error.message.includes('Invalid role')) {
        errorMessage = 'Função inválida. Selecione Gestor ou Vendedor.';
      } else if (error.message === 'Not authenticated') {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      }

      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
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
    onSuccess: () => {
      toast({ title: "Status do usuário atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" }
    > = {
      gestor_owner: { label: "Proprietário", variant: "default" },
      gestor: { label: "Gestor", variant: "secondary" },
      vendedor: { label: "Vendedor", variant: "outline" },
    };
    const config = roleMap[role] || { label: role, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!isOwner && !isGestor) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestão de Usuários</h2>
          <p className="text-muted-foreground">
            <Badge variant="outline" className="mr-2">
              Usuários: {activeAdditionalUsers}/{userLimit}
            </Badge>
            {isOwner ? "Gerencie os usuários da sua empresa" : "Visualize os usuários da empresa"}
          </p>
        </div>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canAddUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  {canAddUser
                    ? "Preencha os dados do novo usuário"
                    : `Limite atingido (${userLimit} usuários adicionais)`}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={12}
                    placeholder="Mín. 12 caracteres"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Deve conter: 12+ caracteres, maiúsculas, minúsculas, números e símbolos
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) =>
                      setFormData({ ...formData, role: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 items-center">
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

      <div className="bg-card rounded-lg border">
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
            {users?.map((user) => {
              const role = user.user_roles?.[0]?.role || "vendedor";
              const isUserOwner = role === "gestor_owner";
              const getInitials = (name: string) => {
                return name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
              };
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={(user as any).avatar_url || undefined} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alterar Foto de {user.name}</DialogTitle>
                          <DialogDescription>
                            Envie uma nova foto de perfil para este usuário
                          </DialogDescription>
                        </DialogHeader>
                        <AvatarUpload
                          userId={user.id}
                          currentAvatarUrl={(user as any).avatar_url}
                          userName={user.name}
                          onUploadComplete={() => {
                            queryClient.invalidateQueries({ queryKey: ["company-users"] });
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.name}
                    {isUserOwner && (
                      <Crown className="inline ml-2 h-4 w-4 text-yellow-500" />
                    )}
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
                          onClick={() =>
                            toggleUserActiveMutation.mutate({
                              userId: user.id,
                              active: !user.active,
                            })
                          }
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
      </div>
    </div>
  );
};

export default UserManagement;
