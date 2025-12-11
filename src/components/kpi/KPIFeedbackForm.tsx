import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ThumbsUp, MessageSquare, AlertTriangle } from "lucide-react";

interface KPIFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  companyId: string;
  month: Date;
}

export const KPIFeedbackForm = ({
  open,
  onOpenChange,
  userId,
  userName,
  companyId,
  month
}: KPIFeedbackFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const [feedbackType, setFeedbackType] = useState<'positivo' | 'negativo' | 'advertencia'>('positivo');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem do feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      
      const { error } = await supabase
        .from('seller_kpi_feedback')
        .insert({
          company_id: companyId,
          user_id: userId,
          feedback_type: feedbackType,
          title: title.trim(),
          message: message.trim(),
          month: monthStart.toISOString().split('T')[0],
          created_by: user.user?.id
        });

      if (error) throw error;

      toast({
        title: "Feedback registrado",
        description: `Feedback para ${userName} foi salvo com sucesso.`
      });

      queryClient.invalidateQueries({ queryKey: ['kpi-feedback'] });
      setTitle('');
      setMessage('');
      setFeedbackType('positivo');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar feedback",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (feedbackType) {
      case 'positivo': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negativo': return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      case 'advertencia': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lançar Feedback</DialogTitle>
          <DialogDescription>
            Feedback para {userName} - {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Feedback</Label>
            <Select value={feedbackType} onValueChange={(v: any) => setFeedbackType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positivo">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    Feedback Positivo
                  </div>
                </SelectItem>
                <SelectItem value="negativo">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-yellow-500" />
                    Pontos de Melhoria
                  </div>
                </SelectItem>
                <SelectItem value="advertencia">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Advertência Formal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Excelente desempenho em vendas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem Detalhada</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o feedback em detalhes..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getTypeIcon()}
            <span className="ml-2">Registrar Feedback</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
