import { format } from "date-fns";
import { Clock, Users, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import MeetingDetailDialog from "./MeetingDetailDialog";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getUserColor } from "@/lib/userColors";

interface MeetingCardProps {
  meeting: any;
  onRefetch: () => void;
}

const MeetingCard = ({ meeting, onRefetch }: MeetingCardProps) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const clickTimeRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: meeting.id,
    data: {
      meeting,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Determina a cor baseada no primeiro participante (organizador)
  const organizerParticipant = meeting.meeting_participants?.find((p: any) => p.is_organizer);
  const userColor = organizerParticipant ? getUserColor(organizerParticipant.user_id) : getUserColor("default");

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "agendada":
        return "border-l-[#1a73e8]";
      case "realizada":
        return "border-l-[#0f9d58]";
      case "cancelada":
        return "border-l-[#ea4335]";
      default:
        return "border-l-muted";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "agendada":
        return "bg-[#1a73e8]/10 text-[#1a73e8]";
      case "realizada":
        return "bg-[#0f9d58]/10 text-[#0f9d58]";
      case "cancelada":
        return "bg-[#ea4335]/10 text-[#ea4335]";
      default:
        return "";
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onMouseDown={() => {
          clickTimeRef.current = Date.now();
          hasDraggedRef.current = false;
        }}
        onMouseMove={() => {
          if (clickTimeRef.current > 0) {
            hasDraggedRef.current = true;
          }
        }}
        onClick={(e) => {
          const clickDuration = Date.now() - clickTimeRef.current;
          // Só abre o dialog se foi um clique rápido (menos de 200ms) e não arrastou
          if (!isDragging && !hasDraggedRef.current && clickDuration < 200) {
            e.stopPropagation();
            setDetailOpen(true);
          }
          clickTimeRef.current = 0;
          hasDraggedRef.current = false;
        }}
        className={cn(
          "p-2.5 rounded-lg border-l-4 cursor-grab active:cursor-grabbing",
          "hover:shadow-md transition-all",
          userColor.bg,
          userColor.border,
          userColor.text,
          isDragging && "shadow-lg opacity-50 cursor-grabbing"
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-semibold line-clamp-2 text-sm flex-1">{meeting.title}</p>
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5 shrink-0", getStatusBadgeColor(meeting.status))}>
            {meeting.status === "agendada" ? "Agendada" : meeting.status === "realizada" ? "Realizada" : "Cancelada"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1.5 mb-1">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {format(new Date(meeting.start_time), "HH:mm")} - {format(new Date(meeting.end_time), "HH:mm")}
          </span>
        </div>

        {meeting.lead && (
          <div className="flex items-center gap-1.5 mb-1">
            <UserCircle className="h-3.5 w-3.5" />
            <span className="line-clamp-1 text-xs">{meeting.lead.name}</span>
          </div>
        )}

        {meeting.meeting_participants && meeting.meeting_participants.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <div className="flex items-center gap-1 flex-wrap">
              {meeting.meeting_participants.slice(0, 3).map((p: any, idx: number) => (
                <span key={p.user_id} className="text-xs">
                  {p.profile?.name?.split(' ')[0]}{idx < Math.min(2, meeting.meeting_participants.length - 1) ? ',' : ''}
                </span>
              ))}
              {meeting.meeting_participants.length > 3 && (
                <span className="text-xs">+{meeting.meeting_participants.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <MeetingDetailDialog
        meeting={meeting}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefetch={onRefetch}
      />
    </>
  );
};

export default MeetingCard;
