import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  meeting_participants: {
    user_id: string;
    profiles: {
      name: string;
    };
  }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "CRM Sistema <onboarding@resend.dev>";
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Buscar reuniões que começam em 1 hora
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: meetings, error: meetingsError } = await supabase
      .from("meetings")
      .select(`
        id,
        title,
        start_time,
        meeting_participants!inner(
          user_id,
          reminder_sent,
          profiles!inner(
            name
          )
        )
      `)
      .gte("start_time", now)
      .lte("start_time", oneHourFromNow)
      .eq("meeting_participants.reminder_sent", false);

    if (meetingsError) throw meetingsError;

    console.log(`Found ${meetings?.length || 0} meetings to send reminders`);

    const notifications: any[] = [];

    for (const meeting of meetings || []) {
      for (const participant of meeting.meeting_participants) {
        // Buscar email do usuário
        const { data: authUser } = await supabase.auth.admin.getUserById(
          participant.user_id
        );

        if (authUser?.user?.email) {
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: resendFrom,
                to: [authUser.user.email],
                subject: `Lembrete: Reunião em 1 hora - ${meeting.title}`,
                html: `
                  <h2>Olá!</h2>
                  <p>Você tem uma reunião agendada para daqui a 1 hora:</p>
                  <h3>${meeting.title}</h3>
                  <p><strong>Horário:</strong> ${new Date(meeting.start_time).toLocaleString('pt-BR')}</p>
                  <p>Prepare-se e boa reunião!</p>
                `,
              }),
            });

            if (!emailResponse.ok) {
              throw new Error(`Resend API error: ${emailResponse.status}`);
            }

            notifications.push({
              meeting_id: meeting.id,
              user_id: participant.user_id,
              email: authUser.user.email,
            });

            // Marcar como enviado
            await supabase
              .from("meeting_participants")
              .update({ reminder_sent: true })
              .eq("meeting_id", meeting.id)
              .eq("user_id", participant.user_id);

            console.log(`Reminder sent to ${authUser.user.email}`);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        notifications,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});