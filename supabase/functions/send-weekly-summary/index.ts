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

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Buscar todas as empresas ativas
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, owner_id");

    const notifications: any[] = [];

    for (const company of companies || []) {
      // Estatísticas da semana
      const { data: newLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("company_id", company.id)
        .gte("created_at", oneWeekAgo);

      const { data: closedLeads } = await supabase
        .from("leads")
        .select("id, estimated_value")
        .eq("company_id", company.id)
        .eq("status", "ganho")
        .gte("updated_at", oneWeekAgo);

      const { data: completedTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("company_id", company.id)
        .eq("status", "concluida")
        .gte("updated_at", oneWeekAgo);

      const totalRevenue = closedLeads?.reduce((sum, lead) => sum + (Number(lead.estimated_value) || 0), 0) || 0;

      // Buscar owners e gestores para enviar resumo
      const { data: managers } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!inner(
            name,
            company_id
          )
        `)
        .eq("profiles.company_id", company.id)
        .in("role", ["gestor_owner", "gestor"]);

      for (const manager of managers || []) {
        const { data: authUser } = await supabase.auth.admin.getUserById(manager.user_id);

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
                subject: `📊 Resumo Semanal - ${company.name}`,
                html: `
                  <h2>Resumo da Semana</h2>
                  <p>Olá! Aqui está o resumo de desempenho da sua equipe na última semana:</p>
                  
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">📈 Métricas Principais</h3>
                    <ul style="list-style: none; padding: 0;">
                      <li>✨ <strong>${newLeads?.length || 0}</strong> novos leads</li>
                      <li>🎯 <strong>${closedLeads?.length || 0}</strong> vendas fechadas</li>
                      <li>💰 <strong>R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> em receita</li>
                      <li>✅ <strong>${completedTasks?.length || 0}</strong> tarefas concluídas</li>
                    </ul>
                  </div>

                  <p>Continue acompanhando o desempenho da equipe no sistema!</p>
                  <p><a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/dashboard" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Dashboard</a></p>
                  
                  <p style="color: #666; font-size: 12px; margin-top: 30px;">Este é um resumo automático enviado toda segunda-feira.</p>
                `,
              }),
            });

            if (!emailResponse.ok) {
              throw new Error(`Resend API error: ${emailResponse.status}`);
            }

            notifications.push({
              company_id: company.id,
              user_id: manager.user_id,
              email: authUser.user.email,
            });

            console.log(`Weekly summary sent to ${authUser.user.email}`);
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
    console.error("Error in send-weekly-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});