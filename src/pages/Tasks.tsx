import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskStats } from "@/components/tasks/TaskStats";
import { TaskKanban } from "@/components/tasks/TaskKanban";

const Tasks = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: "",
    assignedTo: [] as string[],
    status: "all",
    leadId: "",
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
    enabled: !!session,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const currentUserId = currentSession?.user?.id;

      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_profile:profiles!tasks_assigned_to_fkey(id, name),
          creator_profile:profiles!tasks_created_by_fkey(id, name),
          lead:leads(id, name)
        `)
        .order("created_at", { ascending: false });

      if (filters.assignedTo.length > 0) {
        query = query.in("assigned_to", filters.assignedTo);
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.leadId) {
        query = query.eq("lead_id", filters.leadId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // For vendedores, filter tasks by their assignments
      if (userRole === "vendedor" && currentUserId) {
        const { data: myAssignments } = await supabase
          .from("task_assignments")
          .select("task_id")
          .eq("user_id", currentUserId);

        const myTaskIds = myAssignments?.map((a) => a.task_id) || [];
        const filteredData = data?.filter((task) => myTaskIds.includes(task.id));

        // Filter by search
        if (filters.search) {
          return filteredData?.filter(task => 
            task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        return filteredData;
      }
      
      // Filter by search after fetching
      if (filters.search) {
        return data?.filter(task => 
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      return data;
    },
    enabled: !!session,
  });

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTask(null);
  };

  const isGestor = userRole === "gestor" || userRole === "gestor_owner";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Tarefas</h1>
          <p className="text-muted-foreground mt-1">
            Organize e acompanhe todas as tarefas da equipe
          </p>
        </div>
        {isGestor && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        )}
      </div>

      <TaskStats tasks={tasks || []} />

      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-8 ml-auto" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-32 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TaskKanban
          tasks={tasks || []}
          onEditTask={handleEditTask}
          isGestor={isGestor}
        />
      )}

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        task={selectedTask}
      />
    </div>
  );
};

export default Tasks;
