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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!lovableApiKey) {
      console.warn("LOVABLE_API_KEY not configured - sending basic reports without AI analysis");
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Buscar todas as empresas ativas
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, system_name");

    const notifications: any[] = [];

    for (const company of companies || []) {
      // Buscar configurações de relatório
      const { data: settings } = await supabase
        .from("report_settings")
        .select("*")
        .eq("company_id", company.id)
        .single();

      if (settings && !settings.daily_reports_enabled) {
        console.log(`Daily reports disabled for company ${company.id}`);
        continue;
      }

      // Buscar todos os vendedores ativos da empresa
      const { data: salespeople } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          company_id,
          active,
          user_roles!inner(
            role
          )
        `)
        .eq("company_id", company.id)
        .eq("active", true);

      // RELATÓRIOS INDIVIDUAIS DE VENDEDORES
      for (const person of salespeople || []) {
        const userId = person.id;

        // Buscar metas do dia
        const { data: dailyGoal } = await supabase
          .from("sales_goals")
          .select("*")
          .eq("user_id", userId)
          .eq("period_type", "daily")
          .lte("start_date", today)
          .gte("end_date", today)
          .single();

        // Desempenho de hoje
        const { data: todayLeads } = await supabase
          .from("leads")
          .select("id, status, estimated_value")
          .eq("assigned_to", userId)
          .gte("created_at", today);

        const { data: todayConversions } = await supabase
          .from("leads")
          .select("id, estimated_value")
          .eq("assigned_to", userId)
          .eq("status", "ganho")
          .gte("updated_at", today);

        const { data: todayObservations } = await supabase
          .from("lead_observations")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", today);

        const { data: todayTasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("assigned_to", userId)
          .eq("status", "concluida")
          .gte("updated_at", today);

        const { data: todayPoints } = await supabase
          .from("gamification_events")
          .select("points")
          .eq("user_id", userId)
          .gte("created_at", today);

        // Desempenho de ontem para comparação
        const { data: yesterdayLeads } = await supabase
          .from("leads")
          .select("id")
          .eq("assigned_to", userId)
          .gte("created_at", yesterday)
          .lt("created_at", today);

        const { data: yesterdayConversions } = await supabase
          .from("leads")
          .select("id")
          .eq("assigned_to", userId)
          .eq("status", "ganho")
          .gte("updated_at", yesterday)
          .lt("updated_at", today);

        // Ranking atual
        const { data: leaderboard } = await supabase
          .from("gamification_events")
          .select("user_id, points")
          .eq("profiles.company_id", company.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        const totalPoints = todayPoints?.reduce((sum, e) => sum + e.points, 0) || 0;
        const leadsCount = todayLeads?.length || 0;
        const conversionsCount = todayConversions?.length || 0;
        const observationsCount = todayObservations?.length || 0;
        const tasksCount = todayTasks?.length || 0;

        const metrics = {
          leads: leadsCount,
          conversions: conversionsCount,
          observations: observationsCount,
          tasks: tasksCount,
          points: totalPoints,
          revenue: todayConversions?.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0) || 0,
        };

        const goals = {
          leads: dailyGoal?.leads_goal || 5,
          conversions: dailyGoal?.conversions_goal || 2,
          observations: dailyGoal?.observations_goal || 10,
          tasks: dailyGoal?.tasks_goal || 3,
        };

        const comparison = {
          yesterday_leads: yesterdayLeads?.length || 0,
          yesterday_conversions: yesterdayConversions?.length || 0,
        };

        // Gerar análise com IA (se disponível)
        let aiInsight = null;
        if (lovableApiKey) {
          try {
            const prompt = `Você é um analista de vendas especializado em CRM. Analise o desempenho diário do vendedor ${person.name}:

DESEMPENHO HOJE:
- ${metrics.leads} leads criados (meta: ${goals.leads})
- ${metrics.conversions} conversões (meta: ${goals.conversions})
- ${metrics.observations} observações (meta: ${goals.observations})
- ${metrics.tasks} tarefas concluídas (meta: ${goals.tasks})
- ${metrics.points} pontos de gamificação

COMPARAÇÃO COM ONTEM:
- Ontem: ${comparison.yesterday_leads} leads, ${comparison.yesterday_conversions} conversões
- Hoje: ${metrics.leads} leads, ${metrics.conversions} conversões

Taxa de conversão hoje: ${metrics.leads > 0 ? ((metrics.conversions / metrics.leads) * 100).toFixed(1) : 0}%

Gere um relatório motivador e prático com:
1. Resumo executivo (2 frases sobre o dia)
2. Destaques positivos (2-3 conquistas específicas)
3. Pontos de atenção (1-2 áreas para melhorar, se houver)
4. Ações sugeridas para amanhã (3 ações específicas e práticas)
5. Motivação personalizada (1 frase encorajadora baseada no desempenho)

Responda APENAS com JSON válido no formato:
{
  "summary": "texto",
  "highlights": ["item1", "item2"],
  "attention_points": ["item1"],
  "suggested_actions": ["ação1", "ação2", "ação3"],
  "motivation": "texto"
}`;

            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "Você é um analista de vendas experiente. Sempre responda com JSON válido." },
                  { role: "user", content: prompt }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content;
              if (content) {
                // Extrair JSON do conteúdo (remover markdown se existir)
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  aiInsight = JSON.parse(jsonMatch[0]);

                  // Salvar no cache
                  await supabase.from("ai_report_insights").upsert({
                    company_id: company.id,
                    user_id: userId,
                    report_type: "daily",
                    report_date: today,
                    summary: aiInsight.summary,
                    highlights: aiInsight.highlights,
                    attention_points: aiInsight.attention_points,
                    suggested_actions: aiInsight.suggested_actions,
                    motivation: aiInsight.motivation,
                  });
                }
              }
            } else if (aiResponse.status === 429 || aiResponse.status === 402) {
              console.warn("Lovable AI rate limit or credits exhausted - using cached insights");
            }
          } catch (aiError) {
            console.error("Error generating AI insights:", aiError);
          }
        }

        // Buscar email do usuário
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);

        if (authUser?.user?.email) {
          const goalsMet = {
            leads: metrics.leads >= goals.leads,
            conversions: metrics.conversions >= goals.conversions,
            observations: metrics.observations >= goals.observations,
          };

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                .metric-card { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .metric-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .metric-value { font-size: 24px; font-weight: bold; }
                .badge-success { background: #48bb78; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
                .badge-warning { background: #ed8936; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
                .ai-section { background: #edf2f7; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
                .action-item { background: white; padding: 10px; margin: 8px 0; border-radius: 6px; border-left: 3px solid #667eea; }
                .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎯 Relatório Diário</h1>
                  <p>Olá, ${person.name}! Aqui está seu resumo de hoje (${new Date().toLocaleDateString('pt-BR')})</p>
                </div>

                <div class="metric-card">
                  <h2>📊 Desempenho do Dia</h2>
                  <div class="metric-row">
                    <span>Leads criados</span>
                    <span><span class="metric-value">${metrics.leads}</span> / ${goals.leads} ${goalsMet.leads ? '<span class="badge-success">✓ Meta atingida</span>' : '<span class="badge-warning">Abaixo da meta</span>'}</span>
                  </div>
                  <div class="metric-row">
                    <span>Conversões</span>
                    <span><span class="metric-value">${metrics.conversions}</span> / ${goals.conversions} ${goalsMet.conversions ? '<span class="badge-success">✓ Meta atingida</span>' : ''}</span>
                  </div>
                  <div class="metric-row">
                    <span>Observações</span>
                    <span><span class="metric-value">${metrics.observations}</span> / ${goals.observations}</span>
                  </div>
                  <div class="metric-row">
                    <span>Pontos ganhos</span>
                    <span class="metric-value">${metrics.points}</span>
                  </div>
                </div>

                ${aiInsight ? `
                  <div class="ai-section">
                    <h3>🤖 Análise da IA</h3>
                    <p><strong>${aiInsight.summary}</strong></p>
                  </div>

                  ${aiInsight.highlights?.length > 0 ? `
                    <div class="ai-section">
                      <h3>✨ Destaques</h3>
                      <ul>
                        ${aiInsight.highlights.map((h: string) => `<li>${h}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${aiInsight.attention_points?.length > 0 ? `
                    <div class="ai-section">
                      <h3>⚠️ Pontos de Atenção</h3>
                      <ul>
                        ${aiInsight.attention_points.map((a: string) => `<li>${a}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${aiInsight.suggested_actions?.length > 0 ? `
                    <div style="margin: 20px 0;">
                      <h3>📌 Ações para Amanhã</h3>
                      ${aiInsight.suggested_actions.map((action: string, i: number) => `
                        <div class="action-item">
                          <strong>${i + 1}.</strong> ${action}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  ${aiInsight.motivation ? `
                    <div class="ai-section" style="background: #f0fff4; border-left-color: #48bb78;">
                      <h3>🔥 Motivação</h3>
                      <p><em>"${aiInsight.motivation}"</em></p>
                    </div>
                  ` : ''}
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Ver Dashboard Completo</a>
                </div>

                <div class="footer">
                  <p>Este é um relatório automático enviado todos os dias às ${settings?.daily_report_time || '19:00'}.</p>
                  <p>© ${company.system_name || company.name}</p>
                </div>
              </div>
            </body>
            </html>
          `;

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
                subject: `📊 Seu Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
                html: htmlContent,
              }),
            });

            if (!emailResponse.ok) {
              throw new Error(`Resend API error: ${emailResponse.status}`);
            }

            notifications.push({
              company_id: company.id,
              user_id: userId,
              email: authUser.user.email,
              type: "daily_individual",
            });

            console.log(`Daily report sent to ${authUser.user.email}`);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }
      }

      // RELATÓRIO CONSOLIDADO PARA GESTORES
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
        // Consolidar dados da equipe
        const { data: teamLeads } = await supabase
          .from("leads")
          .select("id, status, estimated_value, assigned_to")
          .eq("company_id", company.id)
          .gte("created_at", today);

        const { data: teamConversions } = await supabase
          .from("leads")
          .select("id, estimated_value, assigned_to")
          .eq("company_id", company.id)
          .eq("status", "ganho")
          .gte("updated_at", today);

        const teamMetrics = {
          total_leads: teamLeads?.length || 0,
          total_conversions: teamConversions?.length || 0,
          total_revenue: teamConversions?.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0) || 0,
          conversion_rate: teamLeads?.length ? ((teamConversions?.length || 0) / teamLeads.length * 100).toFixed(1) : 0,
        };

        // Performance individual de cada vendedor
        const salesPerformance = [];
        for (const person of salespeople || []) {
          const personLeads = teamLeads?.filter(l => l.assigned_to === person.id).length || 0;
          const personConversions = teamConversions?.filter(l => l.assigned_to === person.id).length || 0;

          const { data: personGoal } = await supabase
            .from("sales_goals")
            .select("*")
            .eq("user_id", person.id)
            .eq("period_type", "daily")
            .lte("start_date", today)
            .gte("end_date", today)
            .maybeSingle();

          salesPerformance.push({
            name: person.name,
            leads: personLeads,
            conversions: personConversions,
            goal_leads: personGoal?.leads_goal || 5,
            goal_met: personLeads >= (personGoal?.leads_goal || 5),
          });
        }

        salesPerformance.sort((a, b) => b.conversions - a.conversions);
        const top3 = salesPerformance.slice(0, 3);
        const underperforming = salesPerformance.filter(s => !s.goal_met);

        const { data: authUser } = await supabase.auth.admin.getUserById(manager.user_id);

        if (authUser?.user?.email) {
          const managerHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 700px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
                .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
                .metric-box { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; }
                .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th { background: #edf2f7; padding: 12px; text-align: left; }
                .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                .badge-success { background: #48bb78; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
                .badge-danger { background: #f56565; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
                .alert { background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Resumo Diário da Equipe</h1>
                  <p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div class="metric-grid">
                  <div class="metric-box">
                    <div class="metric-value">${teamMetrics.total_leads}</div>
                    <div>Leads Criados</div>
                  </div>
                  <div class="metric-box">
                    <div class="metric-value">${teamMetrics.total_conversions}</div>
                    <div>Conversões</div>
                  </div>
                  <div class="metric-box">
                    <div class="metric-value">R$ ${teamMetrics.total_revenue.toLocaleString('pt-BR')}</div>
                    <div>Receita</div>
                  </div>
                  <div class="metric-box">
                    <div class="metric-value">${teamMetrics.conversion_rate}%</div>
                    <div>Taxa de Conversão</div>
                  </div>
                </div>

                <h2>🏆 Top 3 Performers</h2>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Posição</th>
                      <th>Vendedor</th>
                      <th>Leads</th>
                      <th>Conversões</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${top3.map((p, i) => `
                      <tr>
                        <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</td>
                        <td>${p.name}</td>
                        <td>${p.leads}</td>
                        <td>${p.conversions}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                ${underperforming.length > 0 ? `
                  <div class="alert">
                    <h3>⚠️ Vendedores Abaixo da Meta</h3>
                    <ul>
                      ${underperforming.map(p => `
                        <li><strong>${p.name}</strong>: ${p.leads}/${p.goal_leads} leads (${((p.leads / p.goal_leads) * 100).toFixed(0)}% da meta)</li>
                      `).join('')}
                    </ul>
                    <p><em>Sugestão: Agendar reunião 1:1 para identificar bloqueios.</em></p>
                  </div>
                ` : ''}

                <h2>👥 Performance Completa da Equipe</h2>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Leads</th>
                      <th>Conversões</th>
                      <th>Meta</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${salesPerformance.map(p => `
                      <tr>
                        <td>${p.name}</td>
                        <td>${p.leads}</td>
                        <td>${p.conversions}</td>
                        <td>${p.goal_leads}</td>
                        <td>${p.goal_met ? '<span class="badge-success">✓ Meta atingida</span>' : '<span class="badge-danger">Abaixo da meta</span>'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Ver Dashboard Completo</a>
                </div>

                <div style="text-align: center; color: #718096; font-size: 12px; margin-top: 30px;">
                  <p>Este é um relatório automático enviado todos os dias às ${settings?.daily_report_time || '19:00'}.</p>
                  <p>© ${company.system_name || company.name}</p>
                </div>
              </div>
            </body>
            </html>
          `;

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
                subject: `📊 Resumo Diário da Equipe - ${new Date().toLocaleDateString('pt-BR')}`,
                html: managerHtml,
              }),
            });

            if (!emailResponse.ok) {
              throw new Error(`Resend API error: ${emailResponse.status}`);
            }

            notifications.push({
              company_id: company.id,
              user_id: manager.user_id,
              email: authUser.user.email,
              type: "daily_manager",
            });

            console.log(`Daily manager report sent to ${authUser.user.email}`);
          } catch (emailError) {
            console.error("Error sending manager email:", emailError);
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
    console.error("Error in send-daily-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
