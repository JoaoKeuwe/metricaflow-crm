import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface FeedbackDialogProps {
  meeting: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
}

const FeedbackDialog = ({ meeting, open, onOpenChange, onRefetch }: FeedbackDialogProps) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione um feedback antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Update meeting with feedback
      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          feedback: feedback,
          feedback_collected: true,
          status: "realizada",
        })
        .eq("id", meeting.id);

      if (updateError) throw updateError;

      // Add note to lead if meeting is linked to a lead
      if (meeting.lead_id) {
        await supabase.from("lead_observations").insert({
          lead_id: meeting.lead_id,
          user_id: user.id,
          content: `Feedback da reunião "${meeting.title}": ${feedback}`,
          note_type: "Reunião realizada",
        });
      }

      toast({
        title: "Feedback enviado",
        description: "Seu feedback foi registrado com sucesso.",
      });

      onRefetch();
      onOpenChange(false);
      setFeedback("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemindLater = () => {
    toast({
      title: "Lembrete criado",
      description: "Você será lembrado novamente mais tarde.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <DialogTitle>Como foi a reunião?</DialogTitle>
          </div>
          <DialogDescription>
            {meeting.lead ? (
              <>
                Reunião: <strong>{meeting.title}</strong> com <strong>{meeting.lead.name}</strong>
              </>
            ) : (
              <>
                Reunião: <strong>{meeting.title}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback da reunião</Label>
            <Textarea
              id="feedback"
              placeholder="Compartilhe como foi a reunião, pontos importantes, próximos passos..."
              className="min-h-[120px] resize-none"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleRemindLater}>
            Lembrar Mais Tarde
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
