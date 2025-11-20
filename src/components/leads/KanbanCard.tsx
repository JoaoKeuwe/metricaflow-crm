import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, MessageCircle, Clock, Building2, Mail, Phone, GripVertical } from "lucide-react";
import { getDaysInCurrentStage, getAgeBadgeVariant, formatDaysAgo } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  lead: any;
  navigate: (path: string) => void;
  formatPhoneForWhatsApp: (phone: string) => string;
  isValidPhone: (phone: string) => boolean;
  isDragging?: boolean;
}

export function KanbanCard({
  lead,
  navigate,
  formatPhoneForWhatsApp,
  isValidPhone,
  isDragging = false,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: lead.id,
  });

  const days = getDaysInCurrentStage(lead.updated_at);
  const badgeVariant = getAgeBadgeVariant(days);
  const daysText = formatDaysAgo(days);
  const updatedDate = format(new Date(lead.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing border-l-4",
        isDragging || isDraggingState ? "shadow-2xl opacity-50 rotate-2" : ""
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-4 pb-3 space-y-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
              {lead.name}
            </h4>
            {lead.company && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
          </div>
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={badgeVariant} className="text-xs font-medium">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysText}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Neste estágio desde {updatedDate}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {lead.hasFutureActivity && (
            <Badge variant="outline" className="text-xs border-primary text-primary">
              {lead.futureActivitiesCount} agendada{lead.futureActivitiesCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-1.5 text-xs">
          {lead.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.profiles && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-xs">👤</span>
              <span className="truncate">{lead.profiles.name}</span>
            </div>
          )}
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-1 pt-1 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/lead/${lead.id}`);
                  }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Detalhes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver informações completas</TooltipContent>
            </Tooltip>

            {lead.phone && isValidPhone(lead.phone) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      const formattedPhone = formatPhoneForWhatsApp(lead.phone);
                      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}`, "_blank");
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir WhatsApp</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
