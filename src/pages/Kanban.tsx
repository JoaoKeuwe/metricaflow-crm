import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  { id: "fechado", title: "Fechado", color: "hsl(142 76% 50%)" },
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

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [searchTerm, setSearchTerm] = useState("");
  const [closedSearchTerm, setClosedSearchTerm] = useState("");
  const [lostSearchTerm, setLostSearchTerm] = useState("");

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

  const { data: allLeads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["kanban-leads", userProfile?.company_id, selectedMonth],
    queryFn: async () => {
      if (!userProfile?.company_id) return [];

      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          profiles:assigned_to(name),
          lead_observations(id, created_at),
          tasks(id, due_date),
          meetings(id, start_time),
          reminders(id, reminder_date)
        `)
        .eq("company_id", userProfile.company_id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return data?.map((lead: any) => {
        const now = new Date();
        const updatedAt = new Date(lead.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        // Verificar se tem atividade futura agendada
        const futureTasks = lead.tasks?.filter((t: any) => t.due_date && new Date(t.due_date) > now) || [];
        const futureMeetings = lead.meetings?.filter((m: any) => m.start_time && new Date(m.start_time) > now) || [];
        const futureReminders = lead.reminders?.filter((r: any) => r.reminder_date && new Date(r.reminder_date) > now) || [];
        
        const hasFutureActivity = futureTasks.length > 0 || futureMeetings.length > 0 || futureReminders.length > 0;
        
        // Pegar a data futura mais próxima
        const allFutureDates = [
          ...futureTasks.map((t: any) => new Date(t.due_date)),
          ...futureMeetings.map((m: any) => new Date(m.start_time)),
          ...futureReminders.map((r: any) => new Date(r.reminder_date))
        ].sort((a, b) => a.getTime() - b.getTime());

        const nextActivityDate = allFutureDates[0];

        return {
          ...lead,
          daysSinceUpdate,
          hasFutureActivity,
          nextActivityDate,
          futureActivitiesCount: futureTasks.length + futureMeetings.length + futureReminders.length,
        };
      }) || [];
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
      await queryClient.cancelQueries({ queryKey: ["kanban-leads"] });
      const previousLeads = queryClient.getQueryData(["kanban-leads", userProfile?.company_id, selectedMonth]);
      
      queryClient.setQueryData(["kanban-leads", userProfile?.company_id, selectedMonth], (old: any) => {
        if (!old) return old;
        return old.map((lead: any) => 
          lead.id === id 
            ? { ...lead, status, updated_at: new Date().toISOString(), daysSinceUpdate: 0 }
            : lead
        );
      });
      
      return { previousLeads };
    },
    onSuccess: () => {
      toast({ title: "Status atualizado com sucesso!" });
    },
    onError: (error, variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["kanban-leads", userProfile?.company_id, selectedMonth], context.previousLeads);
      }
      toast({ 
        title: "Erro ao atualizar status", 
        variant: "destructive" 
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const lead = monthLeads?.find((l: any) => l.id === event.active.id);
    setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    const lead = monthLeads?.find((l: any) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    updateStatusMutation.mutate({ id: leadId, status: newStatus });
  };

  // Leads do período selecionado (mensal ou anual)
  const monthLeads = useMemo(() => {
    if (!allLeads) return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);

    if (viewMode === 'yearly') {
      // Visualização anual - mostrar todos os leads do ano
      return allLeads.filter((lead: any) => {
        // Excluir perdidos do kanban principal
        if (lead.status === 'perdido') return false;
        
        // Incluir leads fechados do ano
        if (lead.status === 'fechado') {
          const updatedDate = new Date(lead.updated_at);
          return updatedDate.getFullYear() === year;
        }
        
        // Incluir leads com atividade agendada no ano
        if (lead.nextActivityDate) {
          const activityDate = new Date(lead.nextActivityDate);
          return activityDate.getFullYear() === year;
        }
        
        return false;
      });
    } else {
      // Visualização mensal
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);

      return allLeads.filter((lead: any) => {
        // Excluir perdidos do kanban principal
        if (lead.status === 'perdido') return false;
        
        // Incluir leads fechados do mês
        if (lead.status === 'fechado') {
          const updatedDate = new Date(lead.updated_at);
          return updatedDate >= monthStart && updatedDate <= monthEnd;
        }
        
        // Incluir leads com atividade agendada no mês
        if (lead.nextActivityDate) {
          const activityDate = new Date(lead.nextActivityDate);
          return activityDate >= monthStart && activityDate <= monthEnd;
        }
        
        return false;
      });
    }
  }, [allLeads, selectedMonth, viewMode]);

  // Leads fechados do período (mensal ou anual)
  const closedLeads = useMemo(() => {
    if (!allLeads) return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);

    return allLeads.filter((lead: any) => {
      if (lead.status !== 'fechado') return false;
      
      const updatedAt = new Date(lead.updated_at);
      
      const isInPeriod = viewMode === 'yearly' 
        ? updatedAt.getFullYear() === year
        : (() => {
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0, 23, 59, 59);
            return updatedAt >= monthStart && updatedAt <= monthEnd;
          })();
      
      if (!isInPeriod) return false;

      if (closedSearchTerm) {
        const searchLower = closedSearchTerm.toLowerCase();
        return (
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.profiles?.name?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [allLeads, selectedMonth, viewMode, closedSearchTerm]);

  // Leads lost/inativos (>30 dias sem atualização, sem atividade futura)
  const lostLeads = useMemo(() => {
    if (!allLeads) return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);

    return allLeads.filter((lead: any) => {
      if (lead.status === 'fechado' || lead.status === 'perdido') return false;
      
      const hasNoFutureActivity = !lead.hasFutureActivity;
      const isStale = lead.daysSinceUpdate > 30;
      const hasNoRecentNotes = !lead.lead_observations || lead.lead_observations.length === 0 || 
        (lead.lead_observations.every((note: any) => {
          const noteDate = new Date(note.created_at);
          const daysSinceNote = Math.floor((new Date().getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceNote > 30;
        }));

      if (!(hasNoFutureActivity && isStale && hasNoRecentNotes)) return false;
      
      // Filtrar por período
      const updatedAt = new Date(lead.updated_at);
      const isInPeriod = viewMode === 'yearly' 
        ? updatedAt.getFullYear() === year
        : (() => {
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0, 23, 59, 59);
            return updatedAt >= monthStart && updatedAt <= monthEnd;
          })();
      
      if (!isInPeriod) return false;

      if (lostSearchTerm) {
        const searchLower = lostSearchTerm.toLowerCase();
        return (
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.profiles?.name?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [allLeads, selectedMonth, viewMode, lostSearchTerm]);

  const filteredMonthLeads = useMemo(() => {
    if (!monthLeads) return [];

    return monthLeads.filter((lead: any) => {
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
  }, [monthLeads, searchTerm]);

  const visibleColumns = useMemo(() => columns, []);


  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kanban de Leads</h1>
        <p className="text-muted-foreground mt-1">
          {viewMode === 'monthly' 
            ? 'Arraste e solte para alterar o status dos leads' 
            : 'Visualização anual - todos os leads do ano'}
        </p>
      </div>

      <KanbanFilters
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        totalLeads={monthLeads?.length || 0}
        visibleLeads={filteredMonthLeads.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
              const columnLeads = filteredMonthLeads
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

      {/* Seção de Leads Fechados */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {viewMode === 'monthly' ? 'Fechados do Mês' : 'Fechados do Ano'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'monthly' 
                ? `Vendas concluídas em ${format(new Date(selectedMonth + '-01'), 'MMMM/yyyy', { locale: ptBR })}`
                : `Vendas concluídas em ${selectedMonth.split('-')[0]}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {closedLeads.length} vendas
          </Badge>
        </div>

        <Input
          placeholder="Buscar por nome do lead ou vendedor..."
          value={closedSearchTerm}
          onChange={(e) => setClosedSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {closedLeads.map((lead: any) => (
            <Card key={lead.id} className="p-4 border-l-4 border-l-green-500">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Vendedor: {lead.profiles?.name || 'Não atribuído'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                {lead.estimated_value && (
                  <p className="text-sm font-medium text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(lead.estimated_value)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Fechado em {format(new Date(lead.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </Card>
          ))}
          {closedLeads.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhuma venda fechada neste mês
            </div>
          )}
        </div>
      </div>

      {/* Seção de Leads Lost/Inativos */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {viewMode === 'monthly' ? 'Leads Inativos do Mês' : 'Leads Inativos do Ano'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Leads sem atualização há mais de 30 dias, sem atividades futuras
            </p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {lostLeads.length} inativos
          </Badge>
        </div>

        <Input
          placeholder="Buscar por nome do lead ou vendedor..."
          value={lostSearchTerm}
          onChange={(e) => setLostSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lostLeads.map((lead: any) => (
            <Card key={lead.id} className="p-4 border-l-4 border-l-red-500">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Vendedor: {lead.profiles?.name || 'Não atribuído'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {lead.daysSinceUpdate} dias sem atualização
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Status: {columns.find(c => c.id === lead.status)?.title || lead.status}
                </p>
              </div>
            </Card>
          ))}
          {lostLeads.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhum lead inativo
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kanban;
