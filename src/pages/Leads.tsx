import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  novo: "bg-blue-500",
  contato_feito: "bg-yellow-500",
  proposta: "bg-purple-500",
  negociacao: "bg-orange-500",
  ganho: "bg-green-500",
  perdido: "bg-red-500",
};

const Leads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    estimated_value: "",
    assigned_to: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["company-users"],
    queryFn: async () => {
      // Get vendedores using the secure user_roles table
      const { data: vendedores, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "vendedor");

      if (rolesError) throw rolesError;
      
      const vendedorIds = vendedores?.map(v => v.user_id) || [];
      
      if (vendedorIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", vendedorIds)
        .eq("company_id", profile?.company_id);

      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "gestor" && !!profile?.company_id,
  });

  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const normalizePhone = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const normalizedPhone = normalizePhone(data.phone);
      
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email || null,
        phone: normalizedPhone,
        company: data.company || null,
        source: data.source || null,
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
        company_id: profile?.company_id,
        assigned_to: data.assigned_to || user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast({ title: "Lead cadastrado com sucesso!" });
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "",
        estimated_value: "",
        assigned_to: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate(formData);
  };

  if (profile?.role !== "gestor") {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Apenas gestores podem gerenciar leads
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os seus leads
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone*</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Origem</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="Ex: Site, Indicação, LinkedIn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_value">Valor Estimado (R$)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimated_value}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Atribuir para</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_to: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Cadastrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads?.map((lead: any) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email || "—"}</TableCell>
                <TableCell>{lead.phone || "—"}</TableCell>
                <TableCell>{lead.company || "—"}</TableCell>
                <TableCell>{lead.profiles?.name}</TableCell>
                <TableCell>
                  <Badge className={statusColors[lead.status]}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/lead/${lead.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Leads;
