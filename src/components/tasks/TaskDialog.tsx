import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: "",
      description: "",
      assigned_to: "",
      lead_id: "",
      due_date: "",
    },
  });

  const { data: companyUsers } = useQuery({
    queryKey: ["company-users"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.session?.user.id)
        .single();

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("company_id", profile?.company_id)
        .eq("active", true);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: leads } = useQuery({
    queryKey: ["leads-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: session } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.session?.user.id)
        .single();

      const taskData = {
        ...data,
        company_id: profile?.company_id,
        created_by: session.session?.user.id,
        lead_id: data.lead_id || null,
        due_date: data.due_date || null,
      };

      const { error } = await supabase.from("tasks").insert(taskData);
      if (error) throw error;

      // Add note to lead if linked
      if (data.lead_id) {
        const assignedUser = companyUsers?.find(u => u.id === data.assigned_to);
        const noteContent = `Tarefa criada: ${data.title} - Atribuída para ${assignedUser?.name || "vendedor"} - Prazo: ${data.due_date ? new Date(data.due_date).toLocaleDateString("pt-BR") : "Sem prazo"}`;
        
        await supabase.from("lead_observations").insert({
          lead_id: data.lead_id,
          user_id: session.session?.user.id,
          content: noteContent,
          note_type: "Tarefa criada",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa criada com sucesso!" });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("tasks")
        .update(data)
        .eq("id", task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa atualizada com sucesso!" });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (task) {
      setValue("title", task.title);
      setValue("description", task.description || "");
      setValue("assigned_to", task.assigned_to);
      setValue("lead_id", task.lead_id || "");
      setValue("due_date", task.due_date ? task.due_date.split("T")[0] : "");
    } else {
      reset();
    }
  }, [task, setValue, reset]);

  const onSubmit = (data: any) => {
    // Clean up data before submitting
    const cleanData = {
      ...data,
      lead_id: data.lead_id || null,
      due_date: data.due_date || null,
    };

    if (task) {
      updateTaskMutation.mutate(cleanData);
    } else {
      createTaskMutation.mutate(cleanData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {task ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Ex: Enviar proposta comercial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Atribuir para *</Label>
              <Select
                value={watch("assigned_to")}
                onValueChange={(value) => setValue("assigned_to", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {companyUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Prazo</Label>
              <Input
                id="due_date"
                type="date"
                {...register("due_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_id">Lead Vinculado (opcional)</Label>
            <Select
              value={watch("lead_id") || undefined}
              onValueChange={(value) => setValue("lead_id", value || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum lead vinculado" />
              </SelectTrigger>
              <SelectContent>
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
            <Button type="submit">
              {task ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
