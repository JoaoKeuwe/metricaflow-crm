import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Eye, MessageCircle, Clock, Building2, Mail, Phone } from "lucide-react";
import { KanbanFilters } from "@/components/leads/KanbanFilters";
import { getDaysInCurrentStage, getAgeBadgeVariant, getTimePeriod, formatDaysAgo } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/leads/KanbanColumn";
import { KanbanCard } from "@/components/leads/KanbanCard";

const columns = [
  { id: "novo", title: "Novo", color: "hsl(210 100% 60%)" },
  { id: "contato_feito", title: "Contato Feito", color: "hsl(45 100% 65%)" },
  { id: "proposta", title: "Proposta", color: "hsl(280 85% 65%)" },
  { id: "negociacao", title: "Negociação", color: "hsl(25 100% 65%)" },
  { id: "ganho", title: "Ganho", color: "hsl(142 76% 50%)" },
  { id: "perdido", title: "Perdido", color: "hsl(0 84% 60%)" },
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
  const [activeLead, setActiveLead] = useState<any>(null);

  useRealtimeLeads();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const { data, error } = await supabase.rpc('get_leads_with_future_activities', {
        p_company_id: userProfile.company_id,
        p_start_date: now.toISOString(),
        p_end_date: oneYearFromNow.toISOString(),
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
    staleTime: 2 * 60 * 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["kanban-leads"] });
      
      // Snapshot do estado anterior
      const previousLeads = queryClient.getQueryData(["kanban-leads", userProfile?.company_id]);
      
      // Atualizar otimisticamente
      queryClient.setQueryData(["kanban-leads", userProfile?.company_id], (old: any) => {
        if (!old) return old;
        return old.map((lead: any) => 
          lead.id === id 
            ? { ...lead, status, updated_at: new Date().toISOString() }
            : lead
        );
      });
      
      return { previousLeads };
    },
    onSuccess: () => {
      toast({ title: "Status atualizado com sucesso!" });
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousLeads) {
        queryClient.setQueryData(["kanban-leads", userProfile?.company_id], context.previousLeads);
      }
      toast({ 
        title: "Erro ao atualizar status", 
        variant: "destructive" 
      });
    },
    onSettled: () => {
      // Sincronizar com servidor após mutation
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads?.find((l: any) => l.id === event.active.id);
    setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    const lead = leads?.find((l: any) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    updateStatusMutation.mutate({ id: leadId, status: newStatus });
  };

  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter((lead: any) => {
      if (activeOnly && !lead.hasFutureActivity) {
        return false;
      }

      if (periodFilter !== "all") {
        const days = getDaysInCurrentStage(lead.updated_at);
        const period = getTimePeriod(days);
        if (period !== periodFilter) return false;
      }

      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

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

  const visibleColumns = useMemo(() => {
    if (activeOnly) {
      return columns.filter(col => 
        ["novo", "contato_feito", "proposta", "negociacao"].includes(col.id)
      );
    }
    return columns;
  }, [activeOnly]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kanban de Leads</h1>
        <p className="text-muted-foreground mt-1">
          Arraste e solte para alterar o status dos leads
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleColumns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80 space-y-3">
              <div className="flex items-center justify-between px-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {visibleColumns.map((column, index) => {
              const columnLeads = filteredLeads
                .filter((lead: any) => lead.status === column.id)
                .sort((a: any, b: any) => {
                  const aDays = getDaysInCurrentStage(a.updated_at);
                  const bDays = getDaysInCurrentStage(b.updated_at);
                  return bDays - aDays;
                });

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={columnLeads.length}
                  leads={columnLeads}
                  isLast={index === visibleColumns.length - 1}
                  navigate={navigate}
                  formatPhoneForWhatsApp={formatPhoneForWhatsApp}
                  isValidPhone={isValidPhone}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="w-80 opacity-90">
                <KanbanCard
                  lead={activeLead}
                  navigate={navigate}
                  formatPhoneForWhatsApp={formatPhoneForWhatsApp}
                  isValidPhone={isValidPhone}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default Kanban;
