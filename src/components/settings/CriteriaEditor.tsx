import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { 
  AdvancementCriteria, 
  useCreateCriteria, 
  useUpdateCriteria, 
  useDeleteCriteria 
} from "@/hooks/useSalesManual";
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

interface CriteriaEditorProps {
  criteria: AdvancementCriteria[];
  stageId: string;
  companyId: string;
}

export const CriteriaEditor = ({ criteria, stageId, companyId }: CriteriaEditorProps) => {
  const createCriteria = useCreateCriteria();
  const updateCriteria = useUpdateCriteria();
  const deleteCriteria = useDeleteCriteria();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    check_type: "manual",
    mandatory: false,
    blocking: false,
  });

  const resetForm = () => {
    setFormData({
      description: "",
      check_type: "manual",
      mandatory: false,
      blocking: false,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    createCriteria.mutate({
      criteria: {
        stage_id: stageId,
        ...formData,
      },
      companyId,
    }, {
      onSuccess: resetForm,
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateCriteria.mutate({
      id: editingId,
      criteria: formData,
    }, {
      onSuccess: resetForm,
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCriteria.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const startEdit = (item: AdvancementCriteria) => {
    setEditingId(item.id);
    setFormData({
      description: item.description,
      check_type: item.check_type,
      mandatory: item.mandatory || false,
      blocking: item.blocking || false,
    });
    setIsAdding(false);
  };

  const stageCriteria = criteria.filter(c => c.stage_id === stageId);

  return (
    <Card className="premium-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Critérios de Avanço</CardTitle>
        {!isAdding && !editingId && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form for adding/editing */}
        {(isAdding || editingId) && (
          <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
            <div className="space-y-2">
              <Label>Descrição do Critério</Label>
              <Input
                placeholder="Ex: Cliente confirmou interesse no orçamento"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Verificação</Label>
                <Select 
                  value={formData.check_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, check_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="observation">Automático (Observação)</SelectItem>
                    <SelectItem value="meeting">Automático (Reunião)</SelectItem>
                    <SelectItem value="task">Automático (Tarefa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mandatory">Obrigatório</Label>
                  <Switch
                    id="mandatory"
                    checked={formData.mandatory}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mandatory: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="blocking">Bloqueante</Label>
                  <Switch
                    id="blocking"
                    checked={formData.blocking}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, blocking: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={!formData.description.trim() || createCriteria.isPending || updateCriteria.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {editingId ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        )}

        {/* List of criteria */}
        {stageCriteria.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum critério cadastrado para esta etapa
          </p>
        ) : (
          <div className="space-y-2">
            {stageCriteria.map((item) => (
              <div 
                key={item.id} 
                className={`p-3 border border-border rounded-lg flex items-center justify-between ${
                  editingId === item.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{item.description}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.check_type === "manual" ? "Manual" : 
                       item.check_type === "observation" ? "Observação" :
                       item.check_type === "meeting" ? "Reunião" : "Tarefa"}
                    </Badge>
                    {item.mandatory && (
                      <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                    )}
                    {item.blocking && (
                      <Badge variant="destructive" className="text-xs">Bloqueante</Badge>
                    )}
                    {item.is_default && (
                      <Badge className="text-xs bg-primary/20 text-primary">Padrão</Badge>
                    )}
                  </div>
                </div>
                {!item.is_default && (
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => startEdit(item)}
                      disabled={!!editingId}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este critério? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
