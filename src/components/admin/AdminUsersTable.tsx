import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Shield, ShieldCheck, UserCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAdminUsers } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
  if (isSuperAdmin) {
    return (
      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Super Admin
      </Badge>
    );
  }
  
  const roles: Record<string, { label: string; className: string }> = {
    gestor_owner: {
      label: "Owner",
      className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    gestor: {
      label: "Gestor",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    vendedor: {
      label: "Vendedor",
      className: "bg-muted text-muted-foreground",
    },
  };

  const roleConfig = roles[role] || roles.vendedor;
  return <Badge className={roleConfig.className}>{roleConfig.label}</Badge>;
};

export const AdminUsersTable = () => {
  const { data: users, isLoading } = useAdminUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Usuários do Sistema ({users?.length || 0})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{user.company_name}</TableCell>
                <TableCell>{getRoleBadge(user.role, user.is_super_admin)}</TableCell>
                <TableCell className="text-center">
                  {user.active ? (
                    <UserCheck className="h-4 w-4 text-green-400 mx-auto" />
                  ) : (
                    <UserX className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
