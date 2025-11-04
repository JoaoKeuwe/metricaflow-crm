import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Buscar leads sem atividade há 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleLeads, error: leadsError } = await supabase
      .from("leads")
      .select(`
        id,
        name,
        status,
        updated_at,
        assigned_to,
        profiles!leads_assigned_to_fkey(
          name
        )
      `)
      .lte("updated_at", sevenDaysAgo)
      .neq("status", "ganho")
      .neq("status", "perdido")
      .not("assigned_to", "is", null);

    if (leadsError) throw leadsError;

    console.log(`Found ${staleLeads?.length || 0} stale leads`);

    const notifications: any[] = [];

    // Agrupar por vendedor
    const leadsByVendedor = new Map<string, any[]>();
    
    for (const lead of staleLeads || []) {
      if (!lead.assigned_to) continue;
      
      if (!leadsByVendedor.has(lead.assigned_to)) {
        leadsByVendedor.set(lead.assigned_to, []);
      }
      leadsByVendedor.get(lead.assigned_to)!.push(lead);
    }

    // Enviar email para cada vendedor
    for (const [userId, leads] of leadsByVendedor.entries()) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);

      if (authUser?.user?.email) {
        const leadsList = leads
          .map((l) => `<li><strong>${l.name}</strong> - ${l.status} (${Math.floor((Date.now() - new Date(l.updated_at).getTime()) / (1000 * 60 * 60 * 24))} dias sem atualização)</li>`)
          .join("");

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
              subject: `⚠️ Você tem ${leads.length} leads sem atualização há mais de 7 dias`,
              html: `
                <h2>Olá ${leads[0].profiles?.name}!</h2>
                <p>Os seguintes leads precisam de atenção:</p>
                <ul>${leadsList}</ul>
                <p>Não deixe suas oportunidades esfriarem! Entre em contato com esses leads o quanto antes.</p>
                <p><a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/leads">Ver Leads no Sistema</a></p>
              `,
            }),
          });

          if (!emailResponse.ok) {
            throw new Error(`Resend API error: ${emailResponse.status}`);
          }

          notifications.push({
            user_id: userId,
            email: authUser.user.email,
            leads_count: leads.length,
          });

          console.log(`Stale leads alert sent to ${authUser.user.email}`);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stale_leads_found: staleLeads?.length || 0,
        notifications_sent: notifications.length,
        notifications,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-stale-leads:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});