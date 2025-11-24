import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, Clock, Edit, Trash2, User, Link as LinkIcon, ChevronDown, Users } from "lucide-react";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getUserId();
  }, []);

  // Fetch task assignments for this task
  const { data: assignments } = useQuery({
    queryKey: ["task-assignments", task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_assignments")
        .select(`
          *,
          user:profiles!task_assignments_user_id_fkey(id, name)
        `)
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!task.id,
  });

  // Get current user's assignment
  const currentUserAssignment = assignments?.find(
    (a) => a.user_id === currentUserId
  );

  const getPriorityColor = (dueDate: string | null) => {
    if (!dueDate) return "border-muted";
    
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0 || days === 0) return "border-destructive";
    if (days <= 3) return "border-amber-500";
    return "border-primary";
  };

  const handleStartTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (task.lead_id) {
      setIsNotesDrawerOpen(true);
    } else {
      completeAssignmentMutation.mutate();
    }
  };

  const completeAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserAssignment) {
        throw new Error("Atribuição não encontrada");
      }

      const { error } = await supabase
        .from("task_assignments")
        .update({
          status: "concluida",
          completed_at: new Date().toISOString(),
        })
        .eq("id", currentUserAssignment.id);

      if (error) throw error;

      // Add note to lead if completed and linked
      if (task.lead_id) {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("lead_observations").insert({
          lead_id: task.lead_id,
          user_id: session?.user?.id,
          content: `Tarefa concluída: ${task.title}`,
          note_type: "Tarefa concluída",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["lead-tasks"] });
      if (task.lead_id) {
        queryClient.invalidateQueries({ queryKey: ["lead-notes", task.lead_id] });
      }
      toast({ title: "Tarefa concluída!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao concluir tarefa",
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
      queryClient.invalidateQueries({ queryKey: ["lead-tasks"] });
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

  // Determine if user can complete this task
  const canComplete = isGestor || (currentUserAssignment?.status === "pendente");
  const isCompleted = currentUserAssignment?.status === "concluida";
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={`border-l-4 ${getPriorityColor(task.due_date)} ${isCompleted ? "opacity-60" : ""}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {isGestor && task.assignment_type === "todos" ? (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Progresso: {task.total_completed || 0}/{task.total_assigned || 0}
                    </Badge>
                  ) : (
                    <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                      {isCompleted ? "Concluída" : "Pendente"}
                    </Badge>
                  )}
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
              {task.assignment_type === "individual" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{task.assigned_profile?.name || "Não atribuída"}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Criado por: {task.creator_profile?.name || "Desconhecido"}</span>
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

            {/* Progress for gestores viewing "todos" tasks */}
            {isGestor && task.assignment_type === "todos" && assignments && (
              <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Progresso da Equipe:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {assignments.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{assignment.user?.name || "Usuário"}</span>
                      {assignment.status === "concluida" ? (
                        <span className="text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {assignment.completed_at &&
                            format(new Date(assignment.completed_at), "dd/MM HH:mm")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pendente</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              {!isCompleted && canComplete && (
                <div className="flex gap-1.5 flex-1">
                  <Button
                    size="sm"
                    onClick={handleStartTask}
                    className="flex-1 h-7 text-xs"
                    disabled={completeAssignmentMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Concluir
                  </Button>
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
