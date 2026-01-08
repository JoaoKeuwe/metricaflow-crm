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

    // Calculate previous period dates
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const periodLength = endDateObj.getTime() - startDateObj.getTime();
    const prevStart = new Date(startDateObj.getTime() - periodLength).toISOString();
    const prevEnd = new Date(startDateObj.getTime() - 1).toISOString();

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
      allLeadsWithAssignedResult,
      allMeetingsResult,
      allTasksResult,
      allObservationsResult,
      allKPIsResult,
      previousPeriodLeadsResult,
      previousPeriodWonResult,
      monthlyLeadsDataResult,
      monthlyRevenueBySellerResult,
    ] = await Promise.all([
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true })),
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'ganho')),
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).in('status', ['novo', 'contato_feito', 'proposta', 'negociacao'])),
      buildQuery(supabaseClient.from('lead_values').select(`*, leads!inner (id, status, assigned_to, created_at)`)),
      buildQuery(supabaseClient.from('lead_values').select(`*, leads!inner (id, status, assigned_to, created_at)`).eq('leads.status', 'ganho')),
      buildQuery(supabaseClient.from('leads').select('status')),
      buildQuery(supabaseClient.from('leads').select('source')),
      buildQuery(supabaseClient.from('leads').select('status')),
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('qualificado', true)),
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).in('status', ['proposta', 'negociacao', 'ganho'])),
      buildQuery(supabaseClient.from('leads').select('created_at, updated_at').eq('status', 'ganho')),
      buildQuery(supabaseClient.from('leads').select('motivo_perda').eq('status', 'perdido')),
      buildQuery(supabaseClient.from('lead_values').select(`*, leads!inner (id, status, assigned_to, created_at)`).in('leads.status', ['novo', 'contato_feito', 'proposta', 'negociacao'])),
      buildQuery(supabaseClient.from('meetings').select('*', { count: 'exact', head: true }).neq('status', 'cancelada')),
      buildQuery(supabaseClient.from('meetings').select('*', { count: 'exact', head: true }).eq('status', 'realizada')),
      buildQuery(supabaseClient.from('tasks').select('*', { count: 'exact', head: true })),
      buildQuery(supabaseClient.from('lead_observations').select('*', { count: 'exact', head: true })),
      supabaseClient.from('marketing_costs').select('*').lte('period_start', end_date).gte('period_end', start_date).order('period_start', { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from('leads').select('id, name, updated_at').in('status', ['novo', 'contato_feito', 'proposta', 'negociacao']).lt('updated_at', twentyFourHoursAgo),
      supabaseClient.from('leads').select('id, name, updated_at').in('status', ['novo', 'contato_feito', 'proposta', 'negociacao']).lt('updated_at', sevenDaysAgo),
      supabaseClient.from('sales_goals').select('*').lte('start_date', end_date).gte('end_date', start_date).order('start_date', { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from('lead_observations').select('lead_id').gte('created_at', sevenDaysAgo).lte('created_at', now.toISOString()),
      buildQuery(supabaseClient.from('leads').select('id, status, assigned_to, created_at, updated_at, estimated_value')),
      buildQuery(supabaseClient.from('meetings').select('id, created_by, status')),
      buildQuery(supabaseClient.from('tasks').select('id, assigned_to, status')),
      buildQuery(supabaseClient.from('lead_observations').select('id, user_id')),
      supabaseClient.from('seller_kpi_monthly').select('*').gte('month', start_date.split('T')[0]).lte('month', end_date.split('T')[0]),
      supabaseClient.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lte('created_at', prevEnd),
      supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'ganho').gte('created_at', prevStart).lte('created_at', prevEnd),
      // New: Monthly leads data for charts
      supabaseClient.from('leads').select('id, status, assigned_to, created_at').gte('created_at', new Date(new Date(start_date).getFullYear(), 0, 1).toISOString()).lte('created_at', end_date),
      // New: Monthly revenue by seller (won leads with values)
      supabaseClient.from('lead_values').select('amount, lead_id, leads!inner(id, assigned_to, status, created_at)').eq('leads.status', 'ganho').gte('leads.created_at', new Date(new Date(start_date).getFullYear(), 0, 1).toISOString()).lte('leads.created_at', end_date),
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

    const totalEstimatedValue = leadValuesResult.data?.reduce((sum: number, value: any) => sum + (Number(value.amount) || 0), 0) || 0;
    const totalConvertedValue = wonLeadValuesResult.data?.reduce((sum: number, value: any) => sum + (Number(value.amount) || 0), 0) || 0;

    const uniqueWonLeadIds = new Set(wonLeadValuesResult.data?.map((v: any) => v.lead_id) || []);
    const wonLeadsWithValues = uniqueWonLeadIds.size;
    const averageTicket = wonLeadsWithValues > 0 ? totalConvertedValue / wonLeadsWithValues : 0;

    const avgTimeInFunnel = closedLeadsWithTimeResult.data?.length > 0
      ? closedLeadsWithTimeResult.data.reduce((sum: number, lead: any) => {
          const days = Math.ceil((new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / closedLeadsWithTimeResult.data.length
      : 0;

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

    const probabilityMap: Record<string, number> = { 'novo': 0.10, 'contato_feito': 0.20, 'proposta': 0.40, 'negociacao': 0.70 };
    const forecast = activeLeadValuesForForecastResult.data?.reduce((sum: number, value: any) => {
      const amount = Number(value.amount) || 0;
      const probability = probabilityMap[value.leads.status] || 0;
      return sum + (amount * probability);
    }, 0) || 0;

    const scheduledMeetings = scheduledMeetingsResult.count || 0;
    const completedMeetings = completedMeetingsResult.count || 0;
    const totalTasks = tasksResult.count || 0;
    const totalObservations = observationsResult.count || 0;
    const totalActivities = scheduledMeetings + totalTasks + totalObservations;

    const statusCounts = statusDataResult.data?.reduce((acc: Record<string, number>, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const colors: Record<string, string> = {
      novo: 'hsl(var(--chart-1))', contato_feito: 'hsl(var(--chart-2))', proposta: 'hsl(var(--chart-3))',
      negociacao: 'hsl(var(--chart-4))', ganho: 'hsl(var(--chart-5))', perdido: 'hsl(var(--chart-6))',
    };

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status, count, color: colors[status] || 'hsl(var(--chart-1))',
    }));

    const sourceCounts = sourceDataResult.data?.reduce((acc: Record<string, number>, lead: any) => {
      const source = lead.source || 'Não informado';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    const sourceData = Object.entries(sourceCounts).map(([source, count], index) => ({
      source, count, color: chartColors[index % chartColors.length],
    }));

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

    const stagesFlow = [
      { from: 'novo', to: 'contato_feito' }, { from: 'contato_feito', to: 'proposta' },
      { from: 'proposta', to: 'negociacao' }, { from: 'negociacao', to: 'ganho' }
    ];

    const conversionByStage = stagesFlow.map(flow => {
      const fromCount = statusCounts[flow.from] || 0;
      const toCount = statusCounts[flow.to] || 0;
      const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : '0.0';
      return { from: flow.from, to: flow.to, rate: `${rate}%` };
    });

    // CAC, LTV, Payback
    let cac = null, ltv = null, payback = null;
    const marketingCostData = marketingCostsResult.data;
    if (marketingCostData && wonLeads > 0) {
      const totalCost = (Number(marketingCostData.marketing_cost) || 0) + (Number(marketingCostData.sales_cost) || 0);
      cac = totalCost / wonLeads;
      const retentionMonths = marketingCostData.average_retention_months || 12;
      ltv = averageTicket * retentionMonths;
      const monthlyTicket = averageTicket / retentionMonths;
      payback = monthlyTicket > 0 ? Math.ceil(cac / monthlyTicket) : null;
    }

    const inactiveLeads24h = inactiveLeads24hResult.data?.length || 0;
    const inactiveLeads7d = inactiveLeads7dResult.data?.length || 0;

    const uniqueContactedLeads = new Set(leadsWithRecentActivityResult.data?.map((o: any) => o.lead_id) || []);
    const followUpRate = totalLeads > 0 ? ((uniqueContactedLeads.size / totalLeads) * 100).toFixed(1) : '0.0';

    const monthlyGoal = salesGoalResult.data?.revenue_goal || 0;
    const goalGap = monthlyGoal - totalConvertedValue;
    const goalPercentage = monthlyGoal > 0 ? ((totalConvertedValue / monthlyGoal) * 100).toFixed(1) : '0.0';

    const lostLeadsCount = lostLeadsResult.data?.length || 0;
    const lossRate = totalLeads > 0 ? ((lostLeadsCount / totalLeads) * 100).toFixed(1) : '0.0';

    // Team performance data
    const teamPerformance: Record<string, any> = {};
    const allLeads = allLeadsWithAssignedResult.data || [];
    const allMeetings = allMeetingsResult.data || [];
    const allTasks = allTasksResult.data || [];
    const allObservations = allObservationsResult.data || [];
    const allKPIs = allKPIsResult.data || [];

    const userIds = new Set<string>();
    allLeads.forEach((lead: any) => { if (lead.assigned_to) userIds.add(lead.assigned_to); });
    allMeetings.forEach((m: any) => { if (m.created_by) userIds.add(m.created_by); });
    allTasks.forEach((t: any) => { if (t.assigned_to) userIds.add(t.assigned_to); });
    allObservations.forEach((o: any) => { if (o.user_id) userIds.add(o.user_id); });

    userIds.forEach(userId => {
      teamPerformance[userId] = {
        id: userId, leads: 0, convertedLeads: 0, revenue: 0, meetings: 0,
        tasks: 0, completedTasks: 0, observations: 0, totalCloseTime: 0, closedCount: 0,
      };
    });

    allLeads.forEach((lead: any) => {
      if (!lead.assigned_to || !teamPerformance[lead.assigned_to]) return;
      const tp = teamPerformance[lead.assigned_to];
      tp.leads += 1;
      if (lead.status === 'ganho') {
        tp.convertedLeads += 1;
        tp.revenue += Number(lead.estimated_value) || 0;
        const created = new Date(lead.created_at);
        const updated = new Date(lead.updated_at);
        const days = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        tp.totalCloseTime += days;
        tp.closedCount += 1;
      }
    });

    const wonLeadIdsSet = new Set(allLeads.filter((l: any) => l.status === 'ganho').map((l: any) => l.id));
    (wonLeadValuesResult.data || []).forEach((lv: any) => {
      if (wonLeadIdsSet.has(lv.lead_id) && lv.leads?.assigned_to && teamPerformance[lv.leads.assigned_to]) {
        const tp = teamPerformance[lv.leads.assigned_to];
        tp.revenue = (tp.revenue || 0) + Number(lv.amount || 0);
      }
    });

    allMeetings.forEach((meeting: any) => {
      if (meeting.created_by && teamPerformance[meeting.created_by]) {
        teamPerformance[meeting.created_by].meetings += 1;
      }
    });

    allTasks.forEach((task: any) => {
      if (task.assigned_to && teamPerformance[task.assigned_to]) {
        teamPerformance[task.assigned_to].tasks += 1;
        if (task.status === 'concluida') teamPerformance[task.assigned_to].completedTasks += 1;
      }
    });

    allObservations.forEach((obs: any) => {
      if (obs.user_id && teamPerformance[obs.user_id]) {
        teamPerformance[obs.user_id].observations += 1;
      }
    });

    const userIdsArray = Array.from(userIds);
    let profilesMap: Record<string, any> = {};
    if (userIdsArray.length > 0) {
      const { data: profiles } = await supabaseClient.from('profiles').select('id, name, avatar_url').in('id', userIdsArray);
      (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });
    }

    const kpiMap: Record<string, any> = {};
    allKPIs.forEach((kpi: any) => { kpiMap[kpi.user_id] = kpi; });

    const teamData = Object.values(teamPerformance).map((tp: any) => {
      const profile = profilesMap[tp.id];
      const kpi = kpiMap[tp.id];
      const convRate = tp.leads > 0 ? (tp.convertedLeads / tp.leads) * 100 : 0;
      const avgClose = tp.closedCount > 0 ? Math.round(tp.totalCloseTime / tp.closedCount) : 0;
      const avgTicket = tp.convertedLeads > 0 ? tp.revenue / tp.convertedLeads : 0;
      const goalProg = kpi && kpi.target_revenue > 0 ? (tp.revenue / kpi.target_revenue) * 100 : undefined;

      return {
        id: tp.id,
        name: profile?.name || 'Usuário',
        avatar: profile?.avatar_url,
        leads: tp.leads,
        convertedLeads: tp.convertedLeads,
        conversionRate: Number(convRate.toFixed(1)),
        revenue: tp.revenue,
        averageTicket: Math.round(avgTicket),
        avgCloseTime: avgClose,
        meetings: tp.meetings,
        tasks: tp.tasks,
        observations: tp.observations,
        goalProgress: goalProg !== undefined ? Number(goalProg.toFixed(1)) : undefined,
      };
    }).filter((t: any) => t.leads > 0 || t.meetings > 0 || t.tasks > 0);

    const totalTeamGoal = allKPIs.reduce((sum: number, kpi: any) => sum + (Number(kpi.target_revenue) || 0), 0);
    const totalTeamAchieved = teamData.reduce((sum: number, t: any) => sum + t.revenue, 0);
    const teamSize = teamData.length;
    const daysRemaining = Math.max(0, Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const previousTotalLeads = previousPeriodLeadsResult.count || 0;
    const previousWonLeads = previousPeriodWonResult.count || 0;

    // Process monthly leads data for Leads vs Closed chart
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyLeadsData = monthlyLeadsDataResult.data || [];
    
    const monthlyLeadsConversion = monthNames.map((month, index) => {
      const monthLeads = monthlyLeadsData.filter((lead: any) => {
        const leadMonth = new Date(lead.created_at).getMonth();
        return leadMonth === index;
      });
      const totalLeads = monthLeads.length;
      const closedLeads = monthLeads.filter((lead: any) => lead.status === 'ganho').length;
      const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
      
      return { month, totalLeads, closedLeads, conversionRate };
    }).filter(m => m.totalLeads > 0 || m.closedLeads > 0);

    // Process monthly revenue by seller
    const monthlyRevenueData = monthlyRevenueBySellerResult.data || [];
    const sellerRevenueMap: Record<string, Record<string, number>> = {};
    const sellerNames = new Set<string>();
    
    monthlyRevenueData.forEach((item: any) => {
      const leadMonth = new Date(item.leads.created_at).getMonth();
      const monthName = monthNames[leadMonth];
      const sellerId = item.leads.assigned_to;
      
      if (!sellerId) return;
      
      if (!sellerRevenueMap[monthName]) {
        sellerRevenueMap[monthName] = {};
      }
      
      sellerRevenueMap[monthName][sellerId] = (sellerRevenueMap[monthName][sellerId] || 0) + Number(item.amount || 0);
      sellerNames.add(sellerId);
    });

    // Get seller names from profiles
    const sellerIdsArray = Array.from(sellerNames);
    let sellerProfilesMap: Record<string, string> = {};
    if (sellerIdsArray.length > 0) {
      const { data: sellerProfiles } = await supabaseClient
        .from('profiles')
        .select('id, name')
        .in('id', sellerIdsArray);
      
      (sellerProfiles || []).forEach((p: any) => {
        sellerProfilesMap[p.id] = p.name;
      });
    }

    const sellerColors = [
      'hsl(215, 70%, 55%)', 'hsl(142, 70%, 45%)', 'hsl(38, 90%, 50%)', 
      'hsl(255, 60%, 60%)', 'hsl(195, 80%, 50%)', 'hsl(340, 70%, 55%)',
      'hsl(170, 70%, 45%)', 'hsl(25, 85%, 55%)'
    ];

    const sellers = sellerIdsArray.map((id, index) => ({
      name: sellerProfilesMap[id] || 'Vendedor',
      color: sellerColors[index % sellerColors.length],
    }));

    const monthlyRevenueBySellerData = monthNames
      .filter(month => sellerRevenueMap[month])
      .map(month => {
        const monthData: Record<string, any> = { month };
        sellerIdsArray.forEach(sellerId => {
          const sellerName = sellerProfilesMap[sellerId] || 'Vendedor';
          monthData[sellerName] = sellerRevenueMap[month]?.[sellerId] || 0;
        });
        return monthData;
      });

    const response = {
      stats: {
        totalLeads, wonLeads, pendingLeads, qualifiedLeads, conversionRate, qualificationRate, winRate,
        totalEstimatedValue, totalConvertedValue, averageTicket, avgTimeInFunnel: Math.round(avgTimeInFunnel),
        scheduledMeetings, completedMeetings, totalActivities, forecast,
        cac: cac !== null ? Math.round(cac * 100) / 100 : null,
        ltv: ltv !== null ? Math.round(ltv * 100) / 100 : null,
        payback,
        inactiveLeads24h, inactiveLeads7d, followUpRate, monthlyGoal, goalGap, goalPercentage, lossRate, lostLeadsCount,
        totalTeamGoal, totalTeamAchieved, teamSize, daysRemaining,
        previousTotalLeads, previousWonLeads,
        previousConversionRate: previousTotalLeads > 0 ? ((previousWonLeads / previousTotalLeads) * 100).toFixed(1) : '0.0',
      },
      statusData, sourceData, funnelData, lossReasonsData, conversionByStage, teamData,
      monthlyLeadsConversion,
      monthlyRevenueBySellerData,
      sellers,
    };

    console.log('Dashboard stats fetched successfully:', response.stats);

    return new Response(JSON.stringify(response), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in get-dashboard-stats:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
