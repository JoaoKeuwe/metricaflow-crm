import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Eye, MessageCircle, Clock, ChevronDown } from "lucide-react";
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

  // Hook centralizado de realtime
  useRealtimeLeads();

  // Expanded cards state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const toggleCard = (leadId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

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

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session?.user?.id)
        .single();
      return data;
    },
    enabled: !!session,
  });

  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["kanban-leads", userProfile?.company_id],
    queryFn: async () => {
      if (!userProfile?.company_id) return [];

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const { data, error } = await supabase.rpc('get_leads_with_future_activities', {
        p_company_id: userProfile.company_id,
        p_start_date: now.toISOString(),
        p_end_date: endOfMonth.toISOString(),
      });

      if (error) throw error;

      return data?.map((lead: any) => ({
        ...lead,
        profiles: lead.profile_name ? { name: lead.profile_name } : null,
        hasFutureActivity: lead.has_future_activity,
        futureActivitiesCount: Number(lead.future_activities_count),
      })) || [];
    },
    enabled: !!userProfile?.company_id,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
  });

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
      // Se activeOnly está ligado, filtrar apenas leads com atividades futuras
      if (activeOnly && !lead.hasFutureActivity) {
        return false;
      }

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
  }, [leads, activeOnly, periodFilter, statusFilter, searchTerm]);

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

      {isLoadingLeads ? (
        <div className={`grid grid-cols-1 gap-4 ${
          activeOnly 
            ? "md:grid-cols-2 lg:grid-cols-4" 
            : "md:grid-cols-3 lg:grid-cols-6"
        }`}>
          {visibleColumns.map((column) => (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-8 ml-auto" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="p-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20 mt-2" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                  const isExpanded = expandedCards.has(lead.id);

                  return (
                    <Collapsible key={lead.id} open={isExpanded} onOpenChange={() => toggleCard(lead.id)}>
                      <Card
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="cursor-move hover:shadow-md transition-all"
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-sm font-medium flex-1 line-clamp-1">
                                {lead.name}
                              </CardTitle>
                              <div className="flex items-center gap-1 shrink-0">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant={badgeVariant} className="text-xs">
                                        {daysText}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Neste estágio desde {updatedDate}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            {lead.hasFutureActivity && (
                              <Badge variant="outline" className="text-xs w-fit mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {lead.futureActivitiesCount} agendada{lead.futureActivitiesCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="p-3 pt-0 space-y-2 border-t">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {lead.email && <p>📧 {lead.email}</p>}
                              {lead.phone && <p>📱 {lead.phone}</p>}
                              {lead.profiles && (
                                <p>👤 {lead.profiles.name}</p>
                              )}
                            </div>
                            
                            <TooltipProvider>
                              <div className="flex items-center gap-1 pt-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/lead/${lead.id}`);
                                      }}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver detalhes</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={!lead.phone || !isValidPhone(lead.phone)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (lead.phone && isValidPhone(lead.phone)) {
                                          const formattedPhone = formatPhoneForWhatsApp(lead.phone);
                                          window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}`, "_blank");
                                        }
                                      }}
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>WhatsApp</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Kanban;
