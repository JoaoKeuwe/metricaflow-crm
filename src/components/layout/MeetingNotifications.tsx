import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const MeetingNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, refetch } = useQuery({
    queryKey: ["meeting-notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("meeting_notifications")
        .select(`
          *,
          meeting:meetings(
            id,
            title,
            start_time,
            end_time,
            created_by_profile:profiles!meetings_created_by_fkey(name)
          )
        `)
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription para novas notificações
  useEffect(() => {
    const channel = supabase
      .channel('meeting-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_notifications',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("meeting_notifications")
      .update({ read: true })
      .eq("id", notificationId);
    
    refetch();
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("meeting_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    
    refetch();
  };

  const unreadCount = notifications?.length || 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações de Reuniões</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma notificação nova</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm line-clamp-2">
                      {notification.meeting?.title}
                    </p>
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    Criado por: {notification.meeting?.created_by_profile?.name}
                  </p>

                  <div className="text-xs text-muted-foreground">
                    📅 {format(new Date(notification.meeting?.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default MeetingNotifications;
