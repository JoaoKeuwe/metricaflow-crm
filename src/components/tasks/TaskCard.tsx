import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Edit, Trash2, User, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  isGestor: boolean;
}

export function TaskCard({ task, onEdit, isGestor }: TaskCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      aberta: { label: "Aberta", variant: "default" },
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "outline" },
    };
    return statusMap[status] || statusMap.aberta;
  };

  const getPriorityColor = (dueDate: string | null) => {
    if (!dueDate) return "border-muted";
    
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0 || days === 0) return "border-destructive";
    if (days <= 3) return "border-yellow-500";
    return "border-green-500";
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", task.id);

      if (error) throw error;

      // Add note to lead if completed and linked
      if (newStatus === "concluida" && task.lead_id) {
        await supabase.from("lead_observations").insert({
          lead_id: task.lead_id,
          user_id: session.session?.user.id,
          content: `Tarefa concluída: ${task.title}`,
          note_type: "Tarefa concluída",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (task.lead_id) {
        queryClient.invalidateQueries({ queryKey: ["lead-notes", task.lead_id] });
      }
      toast({ title: "Status atualizado!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa excluída!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const statusBadge = getStatusBadge(task.status);
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "concluida";

  return (
    <Card className={`border-l-4 ${getPriorityColor(task.due_date)}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">Atrasada</Badge>
              )}
            </div>
            <h4 className="font-semibold leading-tight">{task.title}</h4>
          </div>
          
          <div className="flex gap-1">
            {isGestor && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(task)}
                  className="h-8 w-8"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteTaskMutation.mutate()}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{task.assigned_profile?.name || "Não atribuída"}</span>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                {format(new Date(task.due_date), "dd/MM/yyyy")}
              </span>
            </div>
          )}

          {task.lead && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-3 w-3 text-muted-foreground" />
              <button
                onClick={() => navigate(`/leads/${task.lead_id}`)}
                className="text-primary hover:underline text-sm"
              >
                {task.lead.name}
              </button>
            </div>
          )}
        </div>

        {task.status !== "concluida" && (
          <div className="flex gap-2 pt-2">
            {task.status === "aberta" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate("em_andamento")}
                className="flex-1"
              >
                Iniciar
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate("concluida")}
              className="flex-1"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
