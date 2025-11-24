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

const DEFAULT_POINTS: Record<string, number> = {
  lead_created: 10,
  lead_qualified: 15,
  proposal_sent: 25,
  sale_closed: 100,
  meeting_scheduled: 20,
  observation_added: 3,
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
      
      // Merge with default values for events that don't have settings yet
      const allEvents = Object.keys(EVENT_LABELS);
      const mergedSettings = allEvents.map(event_type => {
        const existingSetting = data?.find(s => s.event_type === event_type);
        return {
          id: existingSetting?.id || `default-${event_type}`,
          event_type,
          points: existingSetting?.points ?? DEFAULT_POINTS[event_type],
          company_id: profile.company_id,
          updated_at: existingSetting?.updated_at,
          updated_by: existingSetting?.updated_by,
          isDefault: !existingSetting
        };
      });
      
      return mergedSettings;
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
            <Card className="premium-card p-6 border-l-4 border-primary">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-lg font-bold text-foreground">
                    {EVENT_LABELS[setting.event_type] || setting.event_type}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {setting.isDefault && <span className="text-accent">(Valor padrão)</span>}
                  </p>
                </div>

                {editingId === setting.event_type ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                      className="w-24 bg-background/50 border-primary/30"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="default"
                      onClick={() => handleSave(setting.event_type)}
                      disabled={updateMutation.isPending}
                      className="h-9 w-9"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {setting.points}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">pts</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(setting.event_type, setting.points)}
                      className="h-9 w-9 hover:bg-primary/10"
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

      <Card className="premium-card p-6 bg-accent/10 border-accent/30">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-accent">Bônus em Vendas:</strong> Para vendas fechadas, além da pontuação base configurada, 
          é adicionado automaticamente <strong>1 ponto extra para cada R$ 1.000</strong> do valor estimado da venda.
        </p>
      </Card>
    </div>
  );
}
