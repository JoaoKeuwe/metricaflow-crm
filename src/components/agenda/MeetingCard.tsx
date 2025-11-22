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
  compact?: boolean;
}

const MeetingCard = ({ meeting, onRefetch, compact = false }: MeetingCardProps) => {
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

  // Modo compacto para vista mensal
  if (compact) {
    return (
      <>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setDetailOpen(true);
          }}
          className={cn(
            "text-xs rounded px-1.5 py-0.5 mb-0.5 cursor-pointer border-l-2",
            "hover:shadow-sm transition-all truncate",
            userColor.bg,
            userColor.border,
            userColor.text
          )}
        >
          <span className="font-medium">{format(new Date(meeting.start_time), "HH:mm")}</span> {meeting.title}
        </div>

        <MeetingDetailDialog
          meeting={meeting}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefetch={onRefetch}
        />
      </>
    );
  }

  // Modo normal para vista semanal
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
          if (!isDragging && !hasDraggedRef.current && clickDuration < 200) {
            e.stopPropagation();
            setDetailOpen(true);
          }
          clickTimeRef.current = 0;
          hasDraggedRef.current = false;
        }}
        className={cn(
          "text-xs rounded px-1 py-0.5 mb-0.5 cursor-pointer border-l-2",
          "hover:shadow-sm transition-all truncate",
          userColor.bg,
          userColor.border,
          userColor.text,
          isDragging && "opacity-50"
        )}
      >
        <div className="font-medium truncate">{meeting.title}</div>
        <div className="text-[10px] opacity-80">
          {format(new Date(meeting.start_time), "HH:mm")}
        </div>
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
