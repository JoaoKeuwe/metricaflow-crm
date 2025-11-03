import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, Clock, Edit, Trash2, User, Link as LinkIcon, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { TaskLeadNotesDrawer } from "./TaskLeadNotesDrawer";

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  isGestor: boolean;
}

export function TaskCard({ task, onEdit, isGestor }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      aberta: { label: "Aberta", variant: "default" },
      em_atraso: { label: "Em Atraso", variant: "destructive" },
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

  const handleStartTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.lead_id) {
      setIsNotesDrawerOpen(true);
    } else {
      updateStatusMutation.mutate("em_atraso");
    }
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
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={`border-l-4 ${getPriorityColor(task.due_date)}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadge.variant} className="text-xs">{statusBadge.label}</Badge>
                  {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
                </div>
                <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className={isOverdue ? "text-destructive font-medium" : ""}>
                      {format(new Date(task.due_date), "dd/MM")}
                    </span>
                  </div>
                )}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-3 pt-0 space-y-3 border-t">
            {task.description && (
              <p className="text-xs text-muted-foreground">{task.description}</p>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{task.assigned_profile?.name || "Não atribuída"}</span>
              </div>

              {task.lead && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/lead/${task.lead_id}`);
                    }}
                    className="text-primary hover:underline text-xs"
                  >
                    {task.lead.name}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {task.status !== "concluida" && (
                <div className="flex gap-1.5 flex-1">
                  {task.status === "aberta" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartTask}
                      className="flex-1 h-7 text-xs"
                    >
                      Iniciar
                    </Button>
                  )}
                  {(task.status === "aberta" || task.status === "em_atraso") && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate("concluida");
                      }}
                      className="flex-1 h-7 text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Concluir
                    </Button>
                  )}
                </div>
              )}
              
              {isGestor && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="h-7 w-7"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTaskMutation.mutate();
                    }}
                    className="h-7 w-7 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      {task.lead_id && (
        <TaskLeadNotesDrawer
          open={isNotesDrawerOpen}
          onOpenChange={setIsNotesDrawerOpen}
          leadId={task.lead_id}
          taskId={task.id}
          leadName={task.lead?.name || "Lead"}
        />
      )}
    </Collapsible>
  );
}
