import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  leads: any[];
  isLast: boolean;
  navigate: (path: string) => void;
  formatPhoneForWhatsApp: (phone: string) => string;
  isValidPhone: (phone: string) => boolean;
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  leads,
  isLast,
  navigate,
  formatPhoneForWhatsApp,
  isValidPhone,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-80">
        <div className="sticky top-0 z-10 bg-background pb-3">
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-semibold text-sm">{title}</h3>
            </div>
            <Badge variant="secondary" className="font-medium">
              {count}
            </Badge>
          </div>
        </div>

        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[400px] rounded-lg border-2 border-dashed transition-all p-3 space-y-3 w-full",
            isOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border bg-muted/30"
          )}
        >
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Nenhum lead
            </div>
          ) : (
            leads.map((lead) => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                navigate={navigate}
                formatPhoneForWhatsApp={formatPhoneForWhatsApp}
                isValidPhone={isValidPhone}
              />
            ))
          )}
        </div>
      </div>

      {!isLast && (
        <div className="flex-shrink-0 w-px bg-border h-[500px] mt-12" />
      )}
    </div>
  );
}
