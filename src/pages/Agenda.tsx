import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import CalendarGrid from "@/components/agenda/CalendarGrid";
import MeetingDialog from "@/components/agenda/MeetingDialog";
import { toast } from "@/hooks/use-toast";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });

  const { data: meetings, isLoading, refetch } = useQuery({
    queryKey: ["meetings", weekStart, weekEnd],
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
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString())
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
      return data;
    },
  });

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Agenda Compartilhada
          </h2>
          <p className="text-muted-foreground">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Reunião
          </Button>
        </div>
      </div>

      <CalendarGrid
        weekDays={weekDays}
        meetings={meetings || []}
        isLoading={isLoading}
        onRefetch={refetch}
      />

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
