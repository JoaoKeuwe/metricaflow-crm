import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const EVENT_LABELS: Record<string, string> = {
  lead_created: "Lead Criado",
  lead_qualified: "Lead Qualificado",
  proposal_sent: "Proposta Enviada",
  sale_closed: "Venda Fechada",
  meeting_scheduled: "Reunião Agendada",
  observation_added: "Observação Adicionada",
};

interface SettingEdit {
  event_type: string;
  points: number;
}

export function GamificationSettings() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["gamification-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) return null;

      const { data, error } = await supabase
        .from("gamification_settings")
        .select("*")
        .eq("company_id", profile.company_id);

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ event_type, points }: SettingEdit) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const { error } = await supabase
        .from("gamification_settings")
        .upsert({
          company_id: profile.company_id,
          event_type,
          points,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "company_id,event_type",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamification-settings"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-events-badges"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Pontuação atualizada com sucesso!");
      setEditingId(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar pontuação: " + error.message);
    },
  });

  const handleEdit = (event_type: string, currentPoints: number) => {
    setEditingId(event_type);
    setEditValue(currentPoints);
  };

  const handleSave = (event_type: string) => {
    if (editValue < 0) {
      toast.error("A pontuação não pode ser negativa");
      return;
    }
    updateMutation.mutate({ event_type, points: editValue });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações de Pontuação</h2>
        <p className="text-muted-foreground">
          Personalize quantos pontos cada ação vale. As alterações afetam todo o ranking.
        </p>
      </div>

      <div className="grid gap-4">
        {settings.map((setting, index) => (
          <motion.div
            key={setting.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-base font-semibold">
                    {EVENT_LABELS[setting.event_type] || setting.event_type}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {setting.event_type}
                  </p>
                </div>

                {editingId === setting.event_type ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                      className="w-24"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="default"
                      onClick={() => handleSave(setting.event_type)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary min-w-[60px] text-right">
                      {setting.points}
                    </span>
                    <span className="text-muted-foreground">pts</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(setting.event_type, setting.points)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Para vendas fechadas, além da pontuação base, é adicionado 1 ponto
          a cada R$ 1.000 do valor estimado da venda.
        </p>
      </Card>
    </div>
  );
}
