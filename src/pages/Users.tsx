import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { UserPlus, Crown, Trash2 } from "lucide-react";

const Users = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"gestor" | "vendedor">("vendedor");

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

  const isOwner = userRole === "gestor_owner";
  const canManageUsers = isOwner || userRole === "gestor";

  const { data: users } = useQuery({
    queryKey: ["company-users", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, created_at, company_id")
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

  const createInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!profile?.company_id || !session?.user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
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
      return data;
    },
    onSuccess: () => {
      toast({ title: "Convite enviado!" });
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      setIsInviteOpen(false);
      setInviteEmail("");
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteRole) return;
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

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Você não tem permissão para gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Usuários</h2>
          <p className="text-muted-foreground">
            {additionalUsers}/{userLimit} usuários adicionais
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
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
              <Input
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} className="w-full" disabled={!inviteEmail}>
                Enviar convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => {
            const role = user.user_roles?.[0]?.role || "vendedor";
            const isUserOwner = role === "gestor_owner";
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {isUserOwner && <Crown className="inline ml-2 h-4 w-4 text-yellow-500" />}
                </TableCell>
                <TableCell>{getRoleBadge(role)}</TableCell>
                <TableCell>
                  {!isUserOwner && isOwner && (
                    <Button size="sm" variant="ghost" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default Users;
