import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, RotateCcw } from "lucide-react";
import { StageGuide, useUpdateStageGuide } from "@/hooks/useSalesManual";

interface StageGuideEditorProps {
  guide: StageGuide | null;
  stageId: string;
  stageName: string;
  companyId: string;
}

export const StageGuideEditor = ({ guide, stageId, stageName, companyId }: StageGuideEditorProps) => {
  const updateGuide = useUpdateStageGuide();
  
  const [formData, setFormData] = useState({
    objective: "",
    mindset: "",
    what_to_say: "",
    mental_triggers: [] as string[],
    common_mistakes: [] as string[],
    ideal_time_days: 0,
    how_to_advance: "",
    how_not_to_advance: "",
  });

  const [newTrigger, setNewTrigger] = useState("");
  const [newMistake, setNewMistake] = useState("");

  useEffect(() => {
    if (guide) {
      setFormData({
        objective: guide.objective || "",
        mindset: guide.mindset || "",
        what_to_say: guide.what_to_say || "",
        mental_triggers: guide.mental_triggers || [],
        common_mistakes: guide.common_mistakes || [],
        ideal_time_days: guide.ideal_time_days || 0,
        how_to_advance: guide.how_to_advance || "",
        how_not_to_advance: guide.how_not_to_advance || "",
      });
    }
  }, [guide]);

  const handleSave = () => {
    updateGuide.mutate({
      guide: {
        stage_id: stageId,
        stage_name: stageName,
        ...formData,
        order_index: guide?.order_index || 0,
      },
      companyId,
    });
  };

  const addTrigger = () => {
    if (newTrigger.trim()) {
      setFormData(prev => ({
        ...prev,
        mental_triggers: [...prev.mental_triggers, newTrigger.trim()],
      }));
      setNewTrigger("");
    }
  };

  const removeTrigger = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mental_triggers: prev.mental_triggers.filter((_, i) => i !== index),
    }));
  };

  const addMistake = () => {
    if (newMistake.trim()) {
      setFormData(prev => ({
        ...prev,
        common_mistakes: [...prev.common_mistakes, newMistake.trim()],
      }));
      setNewMistake("");
    }
  };

  const removeMistake = (index: number) => {
    setFormData(prev => ({
      ...prev,
      common_mistakes: prev.common_mistakes.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card className="premium-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Guia da Etapa: {stageName}</CardTitle>
        <div className="flex gap-2">
          {guide?.is_default === false && (
            <Badge variant="secondary" className="text-xs">Personalizado</Badge>
          )}
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={updateGuide.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            {updateGuide.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Objetivo */}
        <div className="space-y-2">
          <Label htmlFor="objective">Objetivo da Etapa</Label>
          <Textarea
            id="objective"
            placeholder="O que o vendedor deve alcançar nesta etapa..."
            value={formData.objective}
            onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Mentalidade */}
        <div className="space-y-2">
          <Label htmlFor="mindset">Mentalidade Correta</Label>
          <Textarea
            id="mindset"
            placeholder="Qual mindset o vendedor deve ter..."
            value={formData.mindset}
            onChange={(e) => setFormData(prev => ({ ...prev, mindset: e.target.value }))}
            rows={2}
          />
        </div>

        {/* O que Falar */}
        <div className="space-y-2">
          <Label htmlFor="what_to_say">O que Falar</Label>
          <Textarea
            id="what_to_say"
            placeholder="Exemplos de abordagem e frases..."
            value={formData.what_to_say}
            onChange={(e) => setFormData(prev => ({ ...prev, what_to_say: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Gatilhos Mentais */}
        <div className="space-y-2">
          <Label>Gatilhos Mentais</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.mental_triggers.map((trigger, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {trigger}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeTrigger(index)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar gatilho..."
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTrigger())}
            />
            <Button type="button" size="icon" variant="outline" onClick={addTrigger}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Erros Comuns */}
        <div className="space-y-2">
          <Label>Erros Comuns a Evitar</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.common_mistakes.map((mistake, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                {mistake}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeMistake(index)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar erro comum..."
              value={newMistake}
              onChange={(e) => setNewMistake(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMistake())}
            />
            <Button type="button" size="icon" variant="outline" onClick={addMistake}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tempo Ideal */}
        <div className="space-y-2">
          <Label htmlFor="ideal_time">Tempo Ideal (dias)</Label>
          <Input
            id="ideal_time"
            type="number"
            min={0}
            value={formData.ideal_time_days}
            onChange={(e) => setFormData(prev => ({ ...prev, ideal_time_days: parseInt(e.target.value) || 0 }))}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">Máximo de dias que o lead deve permanecer nesta etapa</p>
        </div>

        {/* Como Avançar */}
        <div className="space-y-2">
          <Label htmlFor="how_to_advance">Como Avançar para Próxima Etapa</Label>
          <Textarea
            id="how_to_advance"
            placeholder="O que precisa acontecer para o lead avançar..."
            value={formData.how_to_advance}
            onChange={(e) => setFormData(prev => ({ ...prev, how_to_advance: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Como NÃO Avançar */}
        <div className="space-y-2">
          <Label htmlFor="how_not_to_advance">Quando NÃO Avançar</Label>
          <Textarea
            id="how_not_to_advance"
            placeholder="Sinais de que o lead não está pronto para avançar..."
            value={formData.how_not_to_advance}
            onChange={(e) => setFormData(prev => ({ ...prev, how_not_to_advance: e.target.value }))}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
