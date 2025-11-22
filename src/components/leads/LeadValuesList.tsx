import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { LeadValueDialog } from "./LeadValueDialog";
import { Pencil, Trash2, Plus, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface LeadValue {
  id: string;
  name: string;
  value_type: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

interface LeadValuesListProps {
  leadId: string;
  companyId: string;
}

export function LeadValuesList({ leadId, companyId }: LeadValuesListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<LeadValue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: leadValues, isLoading } = useQuery({
    queryKey: ["lead-values", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_values")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadValue[];
    },
  });

  const createValueMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const amount = parseFloat(data.amount.replace(/[^\d,.-]/g, '').replace(',', '.'));

      const { error } = await supabase
        .from("lead_values")
        .insert({
          lead_id: leadId,
          company_id: companyId,
          name: data.name,
          value_type: data.value_type,
          amount,
          notes: data.notes || null,
          created_by: session.user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-values", leadId] });
      toast({ title: "Valor adicionado com sucesso!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar valor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateValueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const amount = parseFloat(data.amount.replace(/[^\d,.-]/g, '').replace(',', '.'));

      const { error } = await supabase
        .from("lead_values")
        .update({
          name: data.name,
          value_type: data.value_type,
          amount,
          notes: data.notes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-values", leadId] });
      toast({ title: "Valor atualizado com sucesso!" });
      setDialogOpen(false);
      setEditingValue(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar valor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_values")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-values", leadId] });
      toast({ title: "Valor excluído com sucesso!" });
      setDeleteDialogOpen(false);
      setValueToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir valor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    if (editingValue) {
      await updateValueMutation.mutateAsync({ id: editingValue.id, data });
    } else {
      await createValueMutation.mutateAsync(data);
    }
  };

  const handleEdit = (value: LeadValue) => {
    setEditingValue(value);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setValueToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingValue(null);
    setDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalAmount = leadValues?.reduce((sum, v) => sum + Number(v.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Total: {formatCurrency(totalAmount)}
          </span>
        </div>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Valor
        </Button>
      </div>

      {!leadValues || leadValues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum valor cadastrado ainda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Adicionar Valor" para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leadValues.map((value) => (
            <Card key={value.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{value.name}</span>
                    <Badge variant={value.value_type === "recorrente" ? "default" : "secondary"}>
                      {value.value_type === "recorrente" ? "Recorrente" : "Único"}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold text-primary mb-1">
                    {formatCurrency(Number(value.amount))}
                  </div>
                  {value.notes && (
                    <p className="text-sm text-muted-foreground">{value.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(value)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(value.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeadValueDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingValue(null);
        }}
        onSubmit={handleSubmit}
        value={editingValue}
        isLoading={createValueMutation.isPending || updateValueMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este valor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => valueToDelete && deleteValueMutation.mutate(valueToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
