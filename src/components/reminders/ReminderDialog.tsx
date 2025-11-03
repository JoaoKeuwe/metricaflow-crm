import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: any;
}

export function ReminderDialog({ open, onOpenChange, reminder }: ReminderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      description: "",
      reminder_date: "",
      lead_id: "",
    },
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["leads-for-reminder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("reminders").insert({
        description: values.description,
        reminder_date: values.reminder_date,
        lead_id: values.lead_id || null,
        user_id: session?.user?.id,
        completed: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["pending-reminders"] });
      toast({
        title: "Lembrete criado",
        description: "O lembrete foi criado com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("reminders")
        .update({
          description: values.description,
          reminder_date: values.reminder_date,
          lead_id: values.lead_id || null,
        })
        .eq("id", reminder?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["pending-reminders"] });
      toast({
        title: "Lembrete atualizado",
        description: "O lembrete foi atualizado com sucesso.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (reminder) {
      form.reset({
        description: reminder.description || "",
        reminder_date: reminder.reminder_date
          ? format(new Date(reminder.reminder_date), "yyyy-MM-dd'T'HH:mm")
          : "",
        lead_id: reminder.lead_id || "",
      });
    } else {
      form.reset({
        description: "",
        reminder_date: "",
        lead_id: "",
      });
    }
  }, [reminder, form]);

  const onSubmit = (values: any) => {
    if (reminder?.id) {
      updateReminderMutation.mutate(values);
    } else {
      createReminderMutation.mutate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {reminder ? "Editar Lembrete" : "Novo Lembrete"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o lembrete..."
              {...form.register("description", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_date">Data e Hora *</Label>
            <Input
              id="reminder_date"
              type="datetime-local"
              {...form.register("reminder_date", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_id">Lead (Opcional)</Label>
            <Select
              value={form.watch("lead_id")}
              onValueChange={(value) => form.setValue("lead_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum lead</SelectItem>
                {leads?.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                createReminderMutation.isPending ||
                updateReminderMutation.isPending
              }
            >
              {reminder ? "Atualizar" : "Criar"} Lembrete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
