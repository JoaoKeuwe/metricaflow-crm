import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardStatsRequest {
  start_date: string;
  end_date: string;
  user_role: string;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { start_date, end_date, user_role, user_id }: DashboardStatsRequest = await req.json();

    console.log('Fetching dashboard stats:', { start_date, end_date, user_role, user_id });

    // Base query builder
    const buildQuery = (baseQuery: any) => {
      let query = baseQuery
        .gte('created_at', start_date)
        .lte('created_at', end_date);
      
      if (user_role === 'vendedor' && user_id) {
        query = query.eq('assigned_to', user_id);
      }
      
      return query;
    };

    // Calculate dates for inactive leads
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Execute all queries in parallel
    const [
      totalLeadsResult,
      wonLeadsResult,
      pendingLeadsResult,
      leadValuesResult,
      wonLeadValuesResult,
      statusDataResult,
      sourceDataResult,
      funnelDataResult,
      qualifiedLeadsResult,
      opportunitiesResult,
      closedLeadsWithTimeResult,
      lostLeadsResult,
      activeLeadsForForecastResult,
      activeLeadValuesForForecastResult,
      scheduledMeetingsResult,
      completedMeetingsResult,
      tasksResult,
      observationsResult,
      marketingCostsResult,
      inactiveLeads24hResult,
      inactiveLeads7dResult,
      salesGoalResult,
      leadsWithRecentActivityResult,
    ] = await Promise.all([
      // Total leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true })),
      
      // Won leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'ganho')),
      
      // Pending leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).in('status', ['novo', 'contato_feito', 'proposta', 'negociacao'])),
      
      // Lead values (all)
      buildQuery(supabaseClient.from('lead_values').select(`
        *,
        leads!inner (
          id,
          status,
          assigned_to,
          created_at
        )
      `)),
      
      // Won lead values
      buildQuery(supabaseClient.from('lead_values').select(`
        *,
        leads!inner (
          id,
          status,
          assigned_to,
          created_at
        )
      `).eq('leads.status', 'ganho')),
      
      // Status distribution
      buildQuery(supabaseClient.from('leads').select('status')),
      
      // Source distribution
      buildQuery(supabaseClient.from('leads').select('source')),
      
      // Funnel data
      buildQuery(supabaseClient.from('leads').select('status')),

      // Qualified leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('qualificado', true)),

      // Opportunities (leads that reached proposta, negociacao or ganho)
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).in('status', ['proposta', 'negociacao', 'ganho'])),

      // Closed leads with time data
      buildQuery(supabaseClient.from('leads').select('created_at, updated_at').eq('status', 'ganho')),

      // Lost leads with reasons
      buildQuery(supabaseClient.from('leads').select('motivo_perda').eq('status', 'perdido')),

      // Active leads for forecast
      buildQuery(supabaseClient.from('leads').select('id, status').in('status', ['novo', 'contato_feito', 'proposta', 'negociacao'])),

      // Active lead values for forecast
      buildQuery(supabaseClient.from('lead_values').select(`
        *,
        leads!inner (
          id,
          status,
          assigned_to,
          created_at
        )
      `).in('leads.status', ['novo', 'contato_feito', 'proposta', 'negociacao'])),

      // Scheduled meetings
      buildQuery(supabaseClient.from('meetings').select('*', { count: 'exact', head: true }).neq('status', 'cancelada')),

      // Completed meetings
      buildQuery(supabaseClient.from('meetings').select('*', { count: 'exact', head: true }).eq('status', 'realizada')),

      // Tasks
      buildQuery(supabaseClient.from('tasks').select('*', { count: 'exact', head: true })),

      // Observations
      buildQuery(supabaseClient.from('lead_observations').select('*', { count: 'exact', head: true })),

      // Marketing costs for the period
      supabaseClient
        .from('marketing_costs')
        .select('*')
        .lte('period_start', end_date)
        .gte('period_end', start_date)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Leads without activity in last 24 hours (active leads only)
      supabaseClient
        .from('leads')
        .select('id, name, updated_at')
        .in('status', ['novo', 'contato_feito', 'proposta', 'negociacao'])
        .lt('updated_at', twentyFourHoursAgo),

      // Leads without activity in last 7 days
      supabaseClient
        .from('leads')
        .select('id, name, updated_at')
        .in('status', ['novo', 'contato_feito', 'proposta', 'negociacao'])
        .lt('updated_at', sevenDaysAgo),

      // Monthly sales goal for the period
      supabaseClient
        .from('sales_goals')
        .select('*')
        .lte('start_date', end_date)
        .gte('end_date', start_date)
        .is('user_id', null)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Leads with recent activity (observations in last 7 days) - for follow-up rate
      supabaseClient
        .from('lead_observations')
        .select('lead_id')
        .gte('created_at', sevenDaysAgo)
        .lte('created_at', now.toISOString()),
    ]);

    // Calculate metrics
    const totalLeads = totalLeadsResult.count || 0;
    const wonLeads = wonLeadsResult.count || 0;
    const pendingLeads = pendingLeadsResult.count || 0;
    const qualifiedLeads = qualifiedLeadsResult.count || 0;
    const opportunities = opportunitiesResult.count || 0;

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';
    const qualificationRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0.0';
    const winRate = opportunities > 0 ? ((wonLeads / opportunities) * 100).toFixed(1) : '0.0';

    // Calculate values from lead_values table
    const totalEstimatedValue = leadValuesResult.data?.reduce((sum: number, value: any) => 
      sum + (Number(value.amount) || 0), 0) || 0;

    const totalConvertedValue = wonLeadValuesResult.data?.reduce((sum: number, value: any) => 
      sum + (Number(value.amount) || 0), 0) || 0;

    // Calculate unique won leads for average ticket
    const uniqueWonLeadIds = new Set(wonLeadValuesResult.data?.map((v: any) => v.lead_id) || []);
    const wonLeadsWithValues = uniqueWonLeadIds.size;
    const averageTicket = wonLeadsWithValues > 0 ? totalConvertedValue / wonLeadsWithValues : 0;

    // Calculate average time in funnel
    const avgTimeInFunnel = closedLeadsWithTimeResult.data?.length > 0
      ? closedLeadsWithTimeResult.data.reduce((sum: number, lead: any) => {
          const days = Math.ceil(
            (new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) 
            / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / closedLeadsWithTimeResult.data.length
      : 0;

    // Process loss reasons
    const lossReasons = lostLeadsResult.data?.reduce((acc: Record<string, number>, lead: any) => {
      const reason = lead.motivo_perda || 'Não informado';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const lossReasonsData = Object.entries(lossReasons).map(([reason, count]) => ({
      reason,
      count,
      percentage: ((count as number / (lostLeadsResult.data?.length || 1)) * 100).toFixed(1)
    }));

    // Calculate forecast
    const probabilityMap: Record<string, number> = {
      'novo': 0.10,
      'contato_feito': 0.20,
      'proposta': 0.40,
      'negociacao': 0.70
    };

    const forecast = activeLeadValuesForForecastResult.data?.reduce((sum: number, value: any) => {
      const amount = Number(value.amount) || 0;
      const probability = probabilityMap[value.leads.status] || 0;
      return sum + (amount * probability);
    }, 0) || 0;

    // Calculate total activities
    const scheduledMeetings = scheduledMeetingsResult.count || 0;
    const completedMeetings = completedMeetingsResult.count || 0;
    const totalTasks = tasksResult.count || 0;
    const totalObservations = observationsResult.count || 0;
    const totalActivities = scheduledMeetings + totalTasks + totalObservations;

    // Process status data
    const statusCounts = statusDataResult.data?.reduce((acc: Record<string, number>, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const colors: Record<string, string> = {
      novo: 'hsl(var(--chart-1))',
      contato_feito: 'hsl(var(--chart-2))',
      proposta: 'hsl(var(--chart-3))',
      negociacao: 'hsl(var(--chart-4))',
      ganho: 'hsl(var(--chart-5))',
      perdido: 'hsl(var(--chart-6))',
    };

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: colors[status] || 'hsl(var(--chart-1))',
    }));

    // Process source data
    const sourceCounts = sourceDataResult.data?.reduce((acc: Record<string, number>, lead: any) => {
      const source = lead.source || 'Não informado';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const chartColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];

    const sourceData = Object.entries(sourceCounts).map(([source, count], index) => ({
      source,
      count,
      color: chartColors[index % chartColors.length],
    }));

    // Process funnel data with conversion rates
    const stages = [
      { stage: 'Novos', status: 'novo', color: 'hsl(var(--chart-1))' },
      { stage: 'Contato Feito', status: 'contato_feito', color: 'hsl(var(--chart-2))' },
      { stage: 'Proposta', status: 'proposta', color: 'hsl(var(--chart-3))' },
      { stage: 'Negociação', status: 'negociacao', color: 'hsl(var(--chart-4))' },
      { stage: 'Ganho', status: 'ganho', color: 'hsl(var(--chart-5))' },
    ];

    const funnelData = stages.map((stage) => ({
      stage: stage.stage,
      count: funnelDataResult.data?.filter((lead: any) => lead.status === stage.status).length || 0,
      color: stage.color,
    }));

    // Calculate conversion by stage
    const stagesFlow = [
      { from: 'novo', to: 'contato_feito' },
      { from: 'contato_feito', to: 'proposta' },
      { from: 'proposta', to: 'negociacao' },
      { from: 'negociacao', to: 'ganho' }
    ];

    const conversionByStage = stagesFlow.map(flow => {
      const fromCount = statusCounts[flow.from] || 0;
      const toCount = statusCounts[flow.to] || 0;
      const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : '0.0';
      return {
        from: flow.from,
        to: flow.to,
        rate: `${rate}%`
      };
    });

    // Calculate CAC, LTV, and Payback
    let cac = null;
    let ltv = null;
    let payback = null;

    const marketingCostData = marketingCostsResult.data;
    
    if (marketingCostData && wonLeads > 0) {
      const totalCost = (Number(marketingCostData.marketing_cost) || 0) + (Number(marketingCostData.sales_cost) || 0);
      cac = totalCost / wonLeads;

      // LTV = Average Ticket × Average Retention Months
      const retentionMonths = marketingCostData.average_retention_months || 12;
      ltv = averageTicket * retentionMonths;

      // Payback = CAC / (Average Ticket Monthly)
      // Assuming average ticket is for the entire period, we divide by retention months
      const monthlyTicket = averageTicket / retentionMonths;
      payback = monthlyTicket > 0 ? Math.ceil(cac / monthlyTicket) : null;
    }

    // Calculate inactive leads counts
    const inactiveLeads24h = inactiveLeads24hResult.data?.length || 0;
    const inactiveLeads7d = inactiveLeads7dResult.data?.length || 0;

    // Calculate follow-up rate (leads contacted within 7 days / total new leads)
    const uniqueContactedLeads = new Set(leadsWithRecentActivityResult.data?.map((o: any) => o.lead_id) || []);
    const followUpRate = totalLeads > 0 ? ((uniqueContactedLeads.size / totalLeads) * 100).toFixed(1) : '0.0';

    // Get sales goal data
    const monthlyGoal = salesGoalResult.data?.revenue_goal || 0;
    const goalGap = monthlyGoal - totalConvertedValue;
    const goalPercentage = monthlyGoal > 0 ? ((totalConvertedValue / monthlyGoal) * 100).toFixed(1) : '0.0';

    // Loss rate
    const lostLeadsCount = lostLeadsResult.data?.length || 0;
    const lossRate = totalLeads > 0 ? ((lostLeadsCount / totalLeads) * 100).toFixed(1) : '0.0';

    const response = {
      stats: {
        totalLeads,
        wonLeads,
        pendingLeads,
        qualifiedLeads,
        conversionRate,
        qualificationRate,
        winRate,
        totalEstimatedValue,
        totalConvertedValue,
        averageTicket,
        avgTimeInFunnel: Math.round(avgTimeInFunnel),
        scheduledMeetings,
        completedMeetings,
        totalActivities,
        forecast,
        cac: cac !== null ? Math.round(cac * 100) / 100 : null,
        ltv: ltv !== null ? Math.round(ltv * 100) / 100 : null,
        payback: payback,
        // New metrics
        inactiveLeads24h,
        inactiveLeads7d,
        followUpRate,
        monthlyGoal,
        goalGap,
        goalPercentage,
        lossRate,
        lostLeadsCount,
      },
      statusData,
      sourceData,
      funnelData,
      lossReasonsData,
      conversionByStage,
    };

    console.log('Dashboard stats fetched successfully:', response.stats);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-dashboard-stats:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
