import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Trash2, Pencil, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ReminderCardProps {
  reminder: any;
  onEdit: (reminder: any) => void;
  canManage: boolean;
}

export function ReminderCard({ reminder, onEdit, canManage }: ReminderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isOverdue = isPast(new Date(reminder.reminder_date)) && !reminder.completed;

  const completeReminderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("reminders")
        .update({ completed: true })
        .eq("id", reminder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "Lembrete concluído",
        description: "O lembrete foi marcado como concluído.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao concluir lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "Lembrete deletado",
        description: "O lembrete foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className={`p-4 ${isOverdue ? "border-destructive" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <Clock className={`h-4 w-4 mt-0.5 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="font-medium text-sm">{reminder.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(reminder.reminder_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
              {reminder.leads && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Lead: {reminder.leads.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => navigate(`/lead/${reminder.lead_id}`)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!reminder.completed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => completeReminderMutation.mutate()}
              disabled={completeReminderMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </Button>
          )}
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(reminder)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteReminderMutation.mutate()}
                disabled={deleteReminderMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {reminder.completed && (
        <Badge variant="secondary" className="mt-2">
          Concluído
        </Badge>
      )}
    </Card>
  );
}
