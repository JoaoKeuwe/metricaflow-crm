import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Eye, MessageCircle, Clock } from "lucide-react";
import { KanbanFilters } from "@/components/leads/KanbanFilters";
import { getDaysInCurrentStage, getAgeBadgeVariant, getTimePeriod, formatDaysAgo } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const columns = [
  { id: "novo", title: "Novo", color: "bg-blue-500" },
  { id: "contato_feito", title: "Contato Feito", color: "bg-yellow-500" },
  { id: "proposta", title: "Proposta", color: "bg-purple-500" },
  { id: "negociacao", title: "Negociação", color: "bg-orange-500" },
  { id: "ganho", title: "Ganho", color: "bg-green-500" },
  { id: "perdido", title: "Perdido", color: "bg-red-500" },
];

const formatPhoneForWhatsApp = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) return "";
  if (cleanPhone.startsWith("55")) {
    return cleanPhone;
  }
  return `55${cleanPhone}`;
};

const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= 10;
};

const Kanban = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filter states
  const [activeOnly, setActiveOnly] = useState(() => {
    const saved = localStorage.getItem("kanban_active_only");
    return saved ? JSON.parse(saved) : false;
  });
  const [periodFilter, setPeriodFilter] = useState(() => {
    return localStorage.getItem("kanban_period_filter") || "all";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem("kanban_status_filter") || "all";
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Persist filters
  useEffect(() => {
    localStorage.setItem("kanban_active_only", JSON.stringify(activeOnly));
  }, [activeOnly]);

  useEffect(() => {
    localStorage.setItem("kanban_period_filter", periodFilter);
  }, [periodFilter]);

  useEffect(() => {
    localStorage.setItem("kanban_status_filter", statusFilter);
  }, [statusFilter]);

  const { data: leads } = useQuery({
    queryKey: ["kanban-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Realtime listener para sincronização instantânea
  useEffect(() => {
    const channel = supabase
      .channel('kanban-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
  });

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    updateStatusMutation.mutate({ id: leadId, status });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter((lead: any) => {
      // Period filter
      if (periodFilter !== "all") {
        const days = getDaysInCurrentStage(lead.updated_at);
        const period = getTimePeriod(days);
        if (period !== periodFilter) return false;
      }

      // Status filter
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(searchTerm) ||
          lead.company?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [leads, periodFilter, statusFilter, searchTerm]);

  // Visible columns based on activeOnly
  const visibleColumns = useMemo(() => {
    if (activeOnly) {
      return columns.filter(col => 
        ["novo", "contato_feito", "proposta", "negociacao"].includes(col.id)
      );
    }
    return columns;
  }, [activeOnly]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kanban</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e organize seus leads
        </p>
      </div>

      <KanbanFilters
        activeOnly={activeOnly}
        onActiveOnlyChange={setActiveOnly}
        periodFilter={periodFilter}
        onPeriodFilterChange={setPeriodFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        totalLeads={leads?.length || 0}
        visibleLeads={filteredLeads.length}
      />

      <div className={`grid grid-cols-1 gap-4 ${
        activeOnly 
          ? "md:grid-cols-2 lg:grid-cols-4" 
          : "md:grid-cols-3 lg:grid-cols-6"
      }`}>
        {visibleColumns.map((column) => {
          const columnLeads = filteredLeads
            .filter((lead: any) => lead.status === column.id)
            .sort((a: any, b: any) => {
              // Sort by age (oldest first)
              const aDays = getDaysInCurrentStage(a.updated_at);
              const bDays = getDaysInCurrentStage(b.updated_at);
              return bDays - aDays;
            });

          return (
            <div
              key={column.id}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {columnLeads?.length || 0}
                </Badge>
              </div>

              <div className="space-y-2">
                {columnLeads?.map((lead: any) => {
                  const days = getDaysInCurrentStage(lead.updated_at);
                  const badgeVariant = getAgeBadgeVariant(days);
                  const daysText = formatDaysAgo(days);
                  const updatedDate = format(new Date(lead.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

                  return (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="cursor-move hover:shadow-lg transition-all"
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm flex-1">{lead.name}</CardTitle>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={badgeVariant} className="text-xs shrink-0">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {daysText}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Neste estágio desde {updatedDate}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                      <div className="space-y-1">
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-muted-foreground">
                            {lead.phone}
                          </p>
                        )}
                        {lead.profiles && (
                          <Badge variant="outline" className="text-xs">
                            {lead.profiles.name}
                          </Badge>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/lead/${lead.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalhes</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!lead.phone || !isValidPhone(lead.phone)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (lead.phone && isValidPhone(lead.phone)) {
                                    const formattedPhone = formatPhoneForWhatsApp(lead.phone);
                                    try {
                                      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}`, "_blank");
                                    } catch (error) {
                                      toast({
                                        title: "Erro ao abrir WhatsApp",
                                        description: "Verifique se o pop-up não foi bloqueado pelo navegador.",
                                        variant: "destructive",
                                      });
                                    }
                                  } else {
                                    toast({
                                      title: "Telefone inválido",
                                      description: "Este lead não possui um telefone válido.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{lead.phone && isValidPhone(lead.phone) ? "Abrir WhatsApp" : "Telefone inválido"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kanban;
