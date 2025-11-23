import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LeadValueDialog } from "./LeadValueDialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const closedLeadSchema = z.object({
  observation: z.string().min(1, "Observação é obrigatória"),
});

type ClosedLeadFormData = z.infer<typeof closedLeadSchema>;

interface ClosedLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  companyId: string;
  onConfirm: () => void;
}

export function ClosedLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  companyId,
  onConfirm,
}: ClosedLeadDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [deletingValueId, setDeletingValueId] = useState<string | null>(null);

  // Fetch existing lead values
  const { data: leadValues, isLoading: isLoadingValues } = useQuery({
    queryKey: ["lead-values", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_values")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<ClosedLeadFormData>({
    resolver: zodResolver(closedLeadSchema),
    defaultValues: {
      observation: "",
    },
  });

  const handleSubmit = async (data: ClosedLeadFormData) => {
    // Check if there's at least one value
    if (!leadValues || leadValues.length === 0) {
      toast.error("Adicione pelo menos um valor antes de confirmar o fechamento");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      // Create observation with "negócio fechado" type
      const observationContent = `Negócio fechado\n\n${data.observation}`;
      const { error: obsError } = await supabase
        .from("lead_observations")
        .insert({
          lead_id: leadId,
          user_id: session.user.id,
          content: observationContent,
          note_type: "Negócio fechado",
        });

      if (obsError) throw obsError;

      // Update lead status to "fechado"
      const { error: statusError } = await supabase
        .from("leads")
        .update({ status: "fechado" })
        .eq("id", leadId);

      if (statusError) throw statusError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-observations", leadId] });

      toast.success("Negócio fechado com sucesso!");
      form.reset();
      onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error closing lead:", error);
      toast.error(error.message || "Erro ao fechar negócio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddValue = async (valueData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");

    const amount = parseFloat(valueData.amount.replace(/[^\d,.-]/g, '').replace(',', '.'));

    if (editingValue) {
      const { error } = await supabase
        .from("lead_values")
        .update({
          name: valueData.name,
          value_type: valueData.value_type,
          amount: amount,
          notes: valueData.notes || null,
        })
        .eq("id", editingValue.id);

      if (error) throw error;
      toast.success("Valor atualizado!");
    } else {
      const { error } = await supabase
        .from("lead_values")
        .insert({
          lead_id: leadId,
          company_id: companyId,
          name: valueData.name,
          value_type: valueData.value_type,
          amount: amount,
          notes: valueData.notes || null,
          created_by: session.user.id,
        });

      if (error) throw error;
      toast.success("Valor adicionado!");
    }

    queryClient.invalidateQueries({ queryKey: ["lead-values", leadId] });
    setEditingValue(null);
  };

  const handleDeleteValue = async () => {
    if (!deletingValueId) return;

    const { error } = await supabase
      .from("lead_values")
      .delete()
      .eq("id", deletingValueId);

    if (error) {
      toast.error("Erro ao excluir valor");
      return;
    }

    toast.success("Valor excluído!");
    queryClient.invalidateQueries({ queryKey: ["lead-values", leadId] });
    setDeletingValueId(null);
  };

  const totalAmount = leadValues?.reduce((sum, v) => sum + Number(v.amount), 0) || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Fechamento</DialogTitle>
            <DialogDescription>
              Confirme os valores da negociação e adicione observações sobre o fechamento de <strong>{leadName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Valores Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Valores do Negócio</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingValue(null);
                    setValueDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Valor
                </Button>
              </div>

              {isLoadingValues ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                </div>
              ) : leadValues && leadValues.length > 0 ? (
                <div className="space-y-2">
                  {leadValues.map((value) => (
                    <div
                      key={value.id}
                      className="flex items-start justify-between p-3 bg-muted/50 rounded-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{value.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {value.value_type === "recorrente" ? "Recorrente" : "Único"}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold text-primary mt-1">
                          R$ {Number(value.amount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        {value.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{value.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingValue(value);
                            setValueDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingValueId(value.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {totalAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nenhum valor cadastrado.</p>
                  <p className="text-sm mt-1">Adicione pelo menos um valor para confirmar o fechamento.</p>
                </div>
              )}
            </div>

            {/* Observation Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação / Nota Complementar *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhes sobre o fechamento..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !leadValues || leadValues.length === 0}>
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner className="mr-2" size={16} />
                        Salvando...
                      </>
                    ) : (
                      "Confirmar Fechamento"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <LeadValueDialog
        open={valueDialogOpen}
        onOpenChange={setValueDialogOpen}
        onSubmit={handleAddValue}
        value={editingValue}
      />

      <AlertDialog open={!!deletingValueId} onOpenChange={() => setDeletingValueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este valor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteValue}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
