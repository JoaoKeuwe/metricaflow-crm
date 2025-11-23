import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const closedLeadSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório").refine((val) => {
    const num = parseFloat(val.replace(/[^\d,.-]/g, '').replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, "Valor deve ser maior que zero"),
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

  // Fetch existing lead values
  const { data: leadValues } = useQuery({
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
      amount: "",
      observation: "",
    },
  });

  // Pre-fill amount with existing values
  useEffect(() => {
    if (leadValues && leadValues.length > 0 && open) {
      const totalAmount = leadValues.reduce((sum, v) => sum + Number(v.amount), 0);
      form.setValue("amount", totalAmount.toFixed(2).replace('.', ','));
    }
  }, [leadValues, open, form]);

  const handleSubmit = async (data: ClosedLeadFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const amount = parseFloat(data.amount.replace(/[^\d,.-]/g, '').replace(',', '.'));

      // If no existing values, create a new one
      if (!leadValues || leadValues.length === 0) {
        const { error: valueError } = await supabase
          .from("lead_values")
          .insert({
            lead_id: leadId,
            company_id: companyId,
            name: "Valor do Negócio",
            value_type: "unico",
            amount: amount,
            created_by: session.user.id,
          });

        if (valueError) throw valueError;
      }

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

      // Update lead status to "ganho"
      const { error: statusError } = await supabase
        .from("leads")
        .update({ status: "ganho" })
        .eq("id", leadId);

      if (statusError) throw statusError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-values", leadId] });
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

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar Fechamento</DialogTitle>
          <DialogDescription>
            Confirme o valor da negociação e adicione observações sobre o fechamento de <strong>{leadName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Negociação (R$)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação / Nota Complementar</FormLabel>
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
              <Button type="submit" disabled={isSubmitting}>
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
      </DialogContent>
    </Dialog>
  );
}
