import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { ReminderDialog } from "@/components/reminders/ReminderDialog";
import { ReminderFilters } from "@/components/reminders/ReminderFilters";
import { ReminderStats } from "@/components/reminders/ReminderStats";
import { isPast } from "date-fns";

export default function Reminders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: "all",
    leadId: "all",
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_role");
      return data;
    },
  });

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["reminders", filters],
    queryFn: async () => {
      let query = supabase
        .from("reminders")
        .select("*, leads(id, name)")
        .order("reminder_date", { ascending: false });

      // Aplicar filtros
      if (filters.status === "pending") {
        query = query.eq("completed", false);
      } else if (filters.status === "completed") {
        query = query.eq("completed", true);
      }

      if (filters.leadId !== "all") {
        if (filters.leadId === "none") {
          query = query.is("lead_id", null);
        } else {
          query = query.eq("lead_id", filters.leadId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar vencidos no frontend
      if (filters.status === "overdue") {
        return data.filter(
          (r) => !r.completed && isPast(new Date(r.reminder_date))
        );
      }

      return data;
    },
    enabled: !!session,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditReminder = (reminder: any) => {
    setSelectedReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedReminder(null);
  };

  const isGestor = userRole === "gestor" || userRole === "gestor_owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lembretes</h1>
          <p className="text-muted-foreground">
            Gerencie seus lembretes e não perca nenhuma tarefa importante
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      {reminders && <ReminderStats reminders={reminders} />}

      <ReminderFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">
            Carregando lembretes...
          </p>
        ) : reminders && reminders.length > 0 ? (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleEditReminder}
              canManage={isGestor}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhum lembrete encontrado com os filtros aplicados
          </p>
        )}
      </div>

      <ReminderDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        reminder={selectedReminder}
      />
    </div>
  );
}
