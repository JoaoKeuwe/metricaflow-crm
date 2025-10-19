import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Eye, ChevronDown, Calendar } from "lucide-react";
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
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadStats } from "@/components/leads/LeadStats";
import { leadFormSchema, LeadFormData } from "@/lib/schemas";

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
  
  // Hook centralizado de realtime
  useRealtimeLeads();
  
  const [open, setOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    estimated_value: "",
    assigned_to: "",
  });

  // Estados para filtros e organização temporal
  const [period, setPeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [isPeriodOpen, setIsPeriodOpen] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .order("role")
        .limit(1)
        .single();

      return data?.role;
    },
  });

  // Buscar todos vendedores e gestores da empresa para o Select de atribuição
  const { data: users } = useQuery({
    queryKey: ["company-users"],
    queryFn: async () => {
      if (!profile?.company_id) return [];

      // Get vendedores AND gestores using the secure user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["vendedor", "gestor", "gestor_owner"]);

      if (rolesError) throw rolesError;
      
      const userIds = userRoles?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds)
        .eq("company_id", profile.company_id)
        .eq("active", true);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  // Função para calcular intervalo de datas com base no período
  const getDateRange = (periodValue: string) => {
    const now = new Date();
    
    switch (periodValue) {
      case "this-month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case "last-month":
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
        };
      case "last-3-months":
        return {
          start: startOfMonth(subMonths(now, 3)),
          end: endOfDay(now),
        };
      default:
        return { start: null, end: null };
    }
  };

  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["leads", period, searchTerm, statusFilter, responsibleFilter],
    queryFn: async () => {
      const { start, end } = getDateRange(period);
      
      let query = supabase
        .from("leads")
        .select("*, profiles(name)");

      // Filtro temporal
      if (start) query = query.gte("created_at", start.toISOString());
      if (end) query = query.lte("created_at", end.toISOString());

      // Filtro de busca (nome, email, telefone, empresa)
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`
        );
      }

      // Filtro de status
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Filtro de responsável
      if (responsibleFilter && responsibleFilter !== "all") {
        if (responsibleFilter === "unassigned") {
          query = query.is("assigned_to", null);
        } else {
          query = query.eq("assigned_to", responsibleFilter);
        }
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const normalizePhone = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Validar dados do formulário
      const validation = leadFormSchema.safeParse(data);
      if (!validation.success) {
        const errors: Partial<Record<keyof LeadFormData, string>> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof LeadFormData] = err.message;
          }
        });
        setFormErrors(errors);
        throw new Error("Dados inválidos. Verifique os campos.");
      }

      setFormErrors({});

      // Use getSession() instead of getUser() - more reliable
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      if (!profile?.company_id) {
        throw new Error("Perfil da empresa não encontrado. Recarregue a página.");
      }

      const normalizedPhone = normalizePhone(data.phone);
      
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email || null,
        phone: normalizedPhone,
        company: data.company || null,
        source: data.source || null,
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
        company_id: profile.company_id,
        assigned_to: data.assigned_to || session.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast({ title: "Lead cadastrado com sucesso!" });
      setOpen(false);
      setFormErrors({});
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

  // Mutation para atualizar responsável do lead
  const updateLeadAssignment = useMutation({
    mutationFn: async ({ leadId, assignedTo }: { leadId: string; assignedTo: string | null }) => {
      const { error } = await supabase
        .from("leads")
        .update({ 
          assigned_to: assignedTo,
          updated_at: new Date().toISOString()
        })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast({ title: "Responsável atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar responsável",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isGestor = userRole === "gestor" || userRole === "gestor_owner";
  const canEditAssignment = isGestor;

  // Renderizar a tabela de leads
  const renderLeadsTable = () => {
    if (isLoadingLeads) {
      return (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-32" />
            </div>
          ))}
        </div>
      );
    }

    return (
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
          {leads && leads.length > 0 ? (
            leads.map((lead: any) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email || "—"}</TableCell>
                <TableCell>{lead.phone || "—"}</TableCell>
                <TableCell>{lead.company || "—"}</TableCell>
                <TableCell>
                  {canEditAssignment ? (
                    <Select
                      value={lead.assigned_to || "unassigned"}
                      onValueChange={(value) => {
                        const newAssignedTo = value === "unassigned" ? null : value;
                        updateLeadAssignment.mutate({
                          leadId: lead.id,
                          assignedTo: newAssignedTo,
                        });
                      }}
                      disabled={updateLeadAssignment.isPending}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Não atribuído" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Não atribuído</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{lead.profiles?.name || "Não atribuído"}</span>
                  )}
                </TableCell>
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
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e organize seus leads por período
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
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
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
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  required
                  className={formErrors.phone ? "border-destructive" : ""}
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                )}
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
              {isGestor && (
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
              )}
              <Button 
                type="submit" 
                className="w-full"
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar Lead"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <LeadFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        responsibleFilter={responsibleFilter}
        onResponsibleChange={setResponsibleFilter}
        users={users}
        canFilterByResponsible={isGestor}
      />

      {/* Tabs por período */}
      <Collapsible open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
        <div className="bg-card rounded-lg border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Períodos</h3>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isPeriodOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="border-t p-4">
              <Tabs defaultValue="all" value={period} onValueChange={setPeriod}>
                <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="this-month">Este Mês</TabsTrigger>
                  <TabsTrigger value="last-month">Mês Passado</TabsTrigger>
                  <TabsTrigger value="last-3-months">Últimos 3 Meses</TabsTrigger>
                </TabsList>

                {/* Estatísticas */}
                <div className="mt-6">
                  <LeadStats leads={leads || []} period={period} />
                </div>

                {/* Conteúdo das tabs */}
                <TabsContent value="all" className="mt-6">
                  {renderLeadsTable()}
                </TabsContent>

                <TabsContent value="this-month" className="mt-6">
                  {renderLeadsTable()}
                </TabsContent>

                <TabsContent value="last-month" className="mt-6">
                  {renderLeadsTable()}
                </TabsContent>

                <TabsContent value="last-3-months" className="mt-6">
                  {renderLeadsTable()}
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};

export default Leads;
