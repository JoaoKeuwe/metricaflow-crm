import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Check, X, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { 
  StageScript, 
  useCreateScript, 
  useUpdateScript, 
  useDeleteScript 
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

interface ScriptEditorProps {
  scripts: StageScript[];
  stageId: string;
  companyId: string;
}

export const ScriptEditor = ({ scripts, stageId, companyId }: ScriptEditorProps) => {
  const createScript = useCreateScript();
  const updateScript = useUpdateScript();
  const deleteScript = useDeleteScript();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    situation: "",
    script_content: "",
    tags: [] as string[],
    is_active: true,
  });

  const [newTag, setNewTag] = useState("");

  const resetForm = () => {
    setFormData({
      title: "",
      situation: "",
      script_content: "",
      tags: [],
      is_active: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    createScript.mutate({
      script: {
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
    updateScript.mutate({
      id: editingId,
      script: formData,
    }, {
      onSuccess: resetForm,
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteScript.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const startEdit = (item: StageScript) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      situation: item.situation || "",
      script_content: item.script_content,
      tags: item.tags || [],
      is_active: item.is_active ?? true,
    });
    setIsAdding(false);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Script copiado!");
  };

  const stageScripts = scripts.filter(s => s.stage_id === stageId);

  return (
    <Card className="premium-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Scripts Prontos</CardTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Abordagem inicial"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Situação</Label>
                <Input
                  placeholder="Ex: Primeiro contato, Objeção de preço..."
                  value={formData.situation}
                  onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conteúdo do Script</Label>
              <Textarea
                placeholder="Escreva o script que o vendedor deve usar..."
                value={formData.script_content}
                onChange={(e) => setFormData(prev => ({ ...prev, script_content: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" size="icon" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="is_active">Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!formData.title.trim() || !formData.script_content.trim() || createScript.isPending || updateScript.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* List of scripts */}
        {stageScripts.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum script cadastrado para esta etapa
          </p>
        ) : (
          <div className="space-y-2">
            {stageScripts.map((item) => (
              <Collapsible 
                key={item.id}
                open={expandedId === item.id}
                onOpenChange={(open) => setExpandedId(open ? item.id : null)}
              >
                <div 
                  className={`border border-border rounded-lg ${
                    editingId === item.id ? "opacity-50" : ""
                  } ${!item.is_active ? "opacity-60" : ""}`}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          {item.situation && (
                            <Badge variant="outline" className="text-xs">{item.situation}</Badge>
                          )}
                          {item.is_default && (
                            <Badge className="text-xs bg-primary/20 text-primary">Padrão</Badge>
                          )}
                          {!item.is_active && (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!item.is_default && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(item);
                              }}
                              disabled={!!editingId}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(item.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {expandedId === item.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-0 border-t border-border">
                      <div className="relative mt-3">
                        <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg font-sans">
                          {item.script_content}
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => copyToClipboard(item.script_content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este script? Esta ação não pode ser desfeita.
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
