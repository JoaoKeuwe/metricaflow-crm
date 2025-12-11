import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feedback {
  id: string;
  feedback_type: 'positivo' | 'negativo' | 'advertencia';
  title: string;
  message: string;
  created_at: string;
  created_by_name?: string;
}

interface KPIFeedbackTabsProps {
  feedbacks: Feedback[];
}

export const KPIFeedbackTabs = ({ feedbacks }: KPIFeedbackTabsProps) => {
  const positiveFeedbacks = feedbacks.filter(f => f.feedback_type === 'positivo');
  const negativeFeedbacks = feedbacks.filter(f => f.feedback_type === 'negativo');
  const warnings = feedbacks.filter(f => f.feedback_type === 'advertencia');

  const renderFeedbackList = (items: Feedback[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <Card className="premium-card">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((feedback) => (
          <Card key={feedback.id} className="premium-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-medium">{feedback.title}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              </div>
              {feedback.created_by_name && (
                <CardDescription className="text-xs">
                  Por: {feedback.created_by_name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {feedback.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="positivo" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="positivo" className="gap-2">
          <ThumbsUp className="h-4 w-4 text-green-500" />
          Positivo
          {positiveFeedbacks.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {positiveFeedbacks.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="negativo" className="gap-2">
          <MessageSquare className="h-4 w-4 text-yellow-500" />
          Melhorias
          {negativeFeedbacks.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {negativeFeedbacks.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="advertencia" className="gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Advertência
          {warnings.length > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {warnings.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="positivo" className="mt-4">
        {renderFeedbackList(positiveFeedbacks, "Nenhum feedback positivo registrado neste mês.")}
      </TabsContent>

      <TabsContent value="negativo" className="mt-4">
        {renderFeedbackList(negativeFeedbacks, "Nenhum ponto de melhoria registrado neste mês.")}
      </TabsContent>

      <TabsContent value="advertencia" className="mt-4">
        {renderFeedbackList(warnings, "Nenhuma advertência registrada neste mês.")}
      </TabsContent>
    </Tabs>
  );
};
