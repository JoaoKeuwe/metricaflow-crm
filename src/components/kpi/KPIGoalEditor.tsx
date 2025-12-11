import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, DollarSign, Target, Phone, Calendar } from "lucide-react";

interface KPIGoalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  companyId: string;
  month: Date;
  currentGoals?: {
    target_revenue: number;
    target_deals: number;
    target_calls: number;
    target_meetings: number;
  };
}

export const KPIGoalEditor = ({
  open,
  onOpenChange,
  userId,
  userName,
  companyId,
  month,
  currentGoals
}: KPIGoalEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const [targetRevenue, setTargetRevenue] = useState(currentGoals?.target_revenue || 0);
  const [targetDeals, setTargetDeals] = useState(currentGoals?.target_deals || 0);
  const [targetCalls, setTargetCalls] = useState(currentGoals?.target_calls || 0);
  const [targetMeetings, setTargetMeetings] = useState(currentGoals?.target_meetings || 0);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('seller_kpi_monthly')
        .upsert({
          company_id: companyId,
          user_id: userId,
          month: monthStart.toISOString().split('T')[0],
          target_revenue: targetRevenue,
          target_deals: targetDeals,
          target_calls: targetCalls,
          target_meetings: targetMeetings,
          created_by: user.user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,user_id,month'
        });

      if (error) throw error;

      toast({
        title: "Metas atualizadas",
        description: `Metas de ${userName} para ${month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} foram salvas.`
      });

      queryClient.invalidateQueries({ queryKey: ['kpi-monthly'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar metas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Definir Metas</DialogTitle>
          <DialogDescription>
            Metas de {userName} para {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Meta de Faturamento (R$)
            </Label>
            <Input
              id="revenue"
              type="number"
              value={targetRevenue}
              onChange={(e) => setTargetRevenue(Number(e.target.value))}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deals" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Meta de Vendas (quantidade)
            </Label>
            <Input
              id="deals"
              type="number"
              value={targetDeals}
              onChange={(e) => setTargetDeals(Number(e.target.value))}
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calls" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Meta de Ligações/Contatos
            </Label>
            <Input
              id="calls"
              type="number"
              value={targetCalls}
              onChange={(e) => setTargetCalls(Number(e.target.value))}
              placeholder="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Meta de Reuniões
            </Label>
            <Input
              id="meetings"
              type="number"
              value={targetMeetings}
              onChange={(e) => setTargetMeetings(Number(e.target.value))}
              placeholder="20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Metas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
