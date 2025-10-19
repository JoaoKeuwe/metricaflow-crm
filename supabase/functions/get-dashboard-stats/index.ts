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

    // Execute all queries in parallel
    const [
      totalLeadsResult,
      wonLeadsResult,
      pendingLeadsResult,
      estimatedValueResult,
      convertedValueResult,
      statusDataResult,
      sourceDataResult,
      funnelDataResult,
    ] = await Promise.all([
      // Total leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true })),
      
      // Won leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'ganho')),
      
      // Pending leads
      buildQuery(supabaseClient.from('leads').select('*', { count: 'exact', head: true }).in('status', ['novo', 'contato_feito', 'proposta', 'negociacao'])),
      
      // Estimated value
      buildQuery(supabaseClient.from('leads').select('estimated_value')),
      
      // Converted value
      buildQuery(supabaseClient.from('leads').select('estimated_value').eq('status', 'ganho')),
      
      // Status distribution
      buildQuery(supabaseClient.from('leads').select('status')),
      
      // Source distribution
      buildQuery(supabaseClient.from('leads').select('source')),
      
      // Funnel data
      buildQuery(supabaseClient.from('leads').select('status')),
    ]);

    // Calculate metrics
    const totalLeads = totalLeadsResult.count || 0;
    const wonLeads = wonLeadsResult.count || 0;
    const pendingLeads = pendingLeadsResult.count || 0;
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

    const totalEstimatedValue = estimatedValueResult.data?.reduce((sum: number, lead: any) => 
      sum + (Number(lead.estimated_value) || 0), 0) || 0;

    const totalConvertedValue = convertedValueResult.data?.reduce((sum: number, lead: any) => 
      sum + (Number(lead.estimated_value) || 0), 0) || 0;

    const averageTicket = wonLeads > 0 ? totalConvertedValue / wonLeads : 0;

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

    // Process funnel data
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

    const response = {
      stats: {
        totalLeads,
        wonLeads,
        pendingLeads,
        conversionRate,
        totalEstimatedValue,
        totalConvertedValue,
        averageTicket,
      },
      statusData,
      sourceData,
      funnelData,
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
