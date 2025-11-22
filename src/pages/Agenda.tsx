import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarGrid from "@/components/agenda/CalendarGrid";
import CalendarSidebar from "@/components/agenda/CalendarSidebar";
import MeetingDialog from "@/components/agenda/MeetingDialog";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "week" | "workweek" | "month";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // Calculate date ranges based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case "month":
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        };
      case "workweek":
        const weekStart = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000) // 5 days
        };
      default: // week
        return {
          start: startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 0 }),
          end: endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 0 })
        };
    }
  };

  const { start: periodStart, end: periodEnd } = getDateRange();

  const { data: meetings, isLoading, refetch } = useQuery({
    queryKey: ["meetings", periodStart, periodEnd],
    queryFn: async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profileData) return [];

      const { data: meetingsData, error } = await supabase
        .from("meetings")
        .select(`
          *,
          lead:leads(id, name),
          created_by_profile:profiles!meetings_created_by_fkey(id, name),
          meeting_participants(
            user_id,
            is_organizer,
            profile:profiles(id, name)
          )
        `)
        .eq("company_id", profileData.company_id)
        .gte("start_time", periodStart.toISOString())
        .lte("start_time", periodEnd.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return meetingsData;
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["leads-for-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users-for-meetings"],
    queryFn: async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profileData) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("company_id", profileData.company_id)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      
      // Inicializa todos os usuários como selecionados
      if (data && selectedUsers.size === 0) {
        setSelectedUsers(new Set(data.map(u => u.id)));
      }
      
      return data;
    },
  });

  // Filtra reuniões baseado nos usuários selecionados
  const filteredMeetings = useMemo(() => {
    if (!meetings || selectedUsers.size === 0) return [];
    
    return meetings.filter(meeting => {
      // Mostra a reunião se algum participante estiver selecionado
      return meeting.meeting_participants?.some((p: any) => 
        selectedUsers.has(p.user_id)
      );
    });
  }, [meetings, selectedUsers]);

  const displayDays = useMemo(() => {
    if (viewMode === "month") {
      return eachDayOfInterval({ start: periodStart, end: periodEnd });
    } else if (viewMode === "workweek") {
      return eachDayOfInterval({ start: periodStart, end: periodEnd });
    } else {
      return eachDayOfInterval({ start: periodStart, end: periodEnd });
    }
  }, [periodStart, periodEnd, viewMode]);

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <CalendarSidebar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onCreateMeeting={() => setIsCreateDialogOpen(true)}
        users={users || []}
        selectedUsers={selectedUsers}
        onUserToggle={handleUserToggle}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header de Navegação */}
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Agenda
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Hoje
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrevious}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <h2 className="text-xl font-normal">
                {format(currentDate, viewMode === "month" ? "MMMM 'de' yyyy" : "MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana Completa</SelectItem>
                  <SelectItem value="workweek">Segunda a Sexta</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grid do Calendário */}
        <div className="flex-1 overflow-auto">
          <CalendarGrid
            weekDays={displayDays}
            meetings={filteredMeetings}
            isLoading={isLoading}
            onRefetch={refetch}
            viewMode={viewMode}
          />
        </div>
      </div>

      <MeetingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        leads={leads || []}
        users={users || []}
        onSuccess={() => {
          refetch();
          toast({
            title: "Reunião criada",
            description: "A reunião foi criada com sucesso.",
          });
        }}
      />
    </div>
  );
};

export default Agenda;
