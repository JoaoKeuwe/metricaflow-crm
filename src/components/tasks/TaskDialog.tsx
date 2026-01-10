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
      assignment_type: "individual",
      lead_id: "",
      due_date: "",
    },
  });

  // Fetch current user role
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_role");
      return data;
    },
    enabled: open,
  });

  // Fetch current user ID
  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      return session.session?.user.id;
    },
    enabled: open,
  });

  const isGestor = userRole === "gestor" || userRole === "gestor_owner";
  const isVendedor = userRole === "vendedor";

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
      
      if (!session?.session?.user.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.session.user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Perfil do usuário não encontrado");
      }

      const taskData = {
        title: data.title,
        description: data.description,
        assigned_to: data.assignment_type === "individual" ? data.assigned_to : null,
        assignment_type: data.assignment_type,
        company_id: profile.company_id,
        created_by: session.session.user.id,
        lead_id: data.lead_id || null,
        due_date: data.due_date || null,
        status: 'aberta',
      };

      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        throw error;
      }

      // If assignment_type is "todos", create task_assignments for all active users
      if (data.assignment_type === "todos") {
        const { data: users } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", profile.company_id)
          .eq("active", true);

        if (users && users.length > 0) {
          const assignments = users.map((user) => ({
            task_id: newTask.id,
            user_id: user.id,
            company_id: profile.company_id,
            status: "pendente",
          }));

          const { error: assignError } = await supabase
            .from("task_assignments")
            .insert(assignments);

          if (assignError) throw assignError;

          // Update total_assigned count
          await supabase
            .from("tasks")
            .update({ total_assigned: users.length })
            .eq("id", newTask.id);
        }
      } else {
        // For individual assignment, create a single task_assignment
        await supabase
          .from("task_assignments")
          .insert({
            task_id: newTask.id,
            user_id: data.assigned_to,
            company_id: profile.company_id,
            status: "pendente",
          });
      }

      // Add note to lead if linked
      if (data.lead_id) {
        const assignedUser = companyUsers?.find(u => u.id === data.assigned_to);
        const noteContent = data.assignment_type === "todos" 
          ? `Tarefa criada: ${data.title} - Atribuída para TODOS os vendedores - Prazo: ${data.due_date ? new Date(data.due_date).toLocaleDateString("pt-BR") : "Sem prazo"}`
          : `Tarefa criada: ${data.title} - Atribuída para ${assignedUser?.name || "vendedor"} - Prazo: ${data.due_date ? new Date(data.due_date).toLocaleDateString("pt-BR") : "Sem prazo"}`;
        
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
      queryClient.invalidateQueries({ queryKey: ["lead-tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["lead-tasks"] });
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
      setValue("assigned_to", task.assigned_to || "");
      setValue("assignment_type", task.assignment_type || "individual");
      setValue("lead_id", task.lead_id || "");
      setValue("due_date", task.due_date ? task.due_date.split("T")[0] : "");
    } else {
      reset();
      // For vendedores, auto-set assignment to themselves
      if (isVendedor && currentUserId) {
        setValue("assigned_to", currentUserId);
        setValue("assignment_type", "individual");
      }
    }
  }, [task, setValue, reset, isVendedor, currentUserId]);

  const onSubmit = (data: any) => {
    // For vendedores, force self-assignment
    const finalData = isVendedor && !task
      ? { ...data, assigned_to: currentUserId, assignment_type: "individual" }
      : data;

    // Clean up data before submitting
    const cleanData = {
      ...finalData,
      lead_id: finalData.lead_id || null,
      due_date: finalData.due_date || null,
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

          {/* Only show assignment options for gestores */}
          {isGestor && (
            <>
              <div className="space-y-2">
                <Label>Tipo de Atribuição *</Label>
                <Select
                  value={watch("assignment_type")}
                  onValueChange={(value) => setValue("assignment_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Vendedor específico</SelectItem>
                    <SelectItem value="todos">Todos os vendedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watch("assignment_type") === "individual" && (
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
              )}
            </>
          )}

          {/* For vendedores, show info that task will be self-assigned */}
          {isVendedor && !task && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Esta tarefa será atribuída para você
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="due_date">Prazo</Label>
            <Input
              id="due_date"
              type="date"
              {...register("due_date")}
            />
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
