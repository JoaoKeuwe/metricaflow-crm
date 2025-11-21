import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { mapDatabaseError, mapGenericError } from '../_shared/error-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadImport {
  name: string;
  email?: string;
  phone: string;
  company?: string;
  source?: string;
  estimated_value?: number;
}

interface BulkImportRequest {
  leads: LeadImport[];
  auto_prospect?: boolean;
  message_template?: string;
  campaign_name?: string;
  delay_seconds?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    const { 
      leads, 
      auto_prospect = false, 
      message_template,
      campaign_name,
      delay_seconds = 15 
    }: BulkImportRequest = await req.json();

    if (!leads || leads.length === 0) {
      throw new Error('Nenhum lead fornecido');
    }

    if (leads.length > 100) {
      throw new Error('Máximo de 100 leads por importação');
    }

    console.log(`Importando ${leads.length} leads...`);

    const results = {
      success: 0,
      duplicates: 0,
      errors: 0,
      imported_leads: [] as any[],
      error_details: [] as any[],
    };

    // Processar cada lead
    for (const leadData of leads) {
      try {
        // Validar dados obrigatórios
        if (!leadData.name || !leadData.phone) {
          results.errors++;
          results.error_details.push({
            lead: leadData,
            error: 'Nome e telefone são obrigatórios',
          });
          continue;
        }

        // Limpar telefone
        const cleanPhone = leadData.phone.replace(/\D/g, '');

        // Verificar duplicata
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('company_id', profile.company_id)
          .or(`phone.eq.${cleanPhone},email.eq.${leadData.email}`)
          .limit(1)
          .maybeSingle();

        if (existingLead) {
          results.duplicates++;
          continue;
        }

        // Criar lead
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            company_id: profile.company_id,
            name: leadData.name,
            email: leadData.email || null,
            phone: cleanPhone,
            company: leadData.company || null,
            source: leadData.source || 'Importação em Massa',
            estimated_value: leadData.estimated_value || null,
            status: 'novo',
          })
          .select()
          .single();

        if (insertError) {
          const errorResponse = mapDatabaseError(insertError);
          results.errors++;
          results.error_details.push({
            lead: leadData,
            error: errorResponse.error,
          });
          continue;
        }

        results.success++;
        results.imported_leads.push(newLead);

      } catch (error: any) {
        results.errors++;
        results.error_details.push({
          lead: leadData,
          error: 'Erro ao processar lead',
        });
      }
    }

    let campaignId = null;

    // Se auto_prospect está ativo, criar campanha
    if (auto_prospect && message_template && results.imported_leads.length > 0) {
      // Validar template de mensagem
      if (message_template.length > 4096) {
        throw new Error('Template de mensagem muito longo. Máximo 4096 caracteres');
      }

      const dangerousPatterns = /<script|javascript:|onerror=|onclick=|<iframe/i;
      if (dangerousPatterns.test(message_template)) {
        throw new Error('Template contém caracteres ou padrões não permitidos');
      }

      // Sanitizar template
      const sanitizedTemplate = message_template
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      const { data: campaign, error: campaignError } = await supabase
        .from('whatsapp_campaigns')
        .insert({
          company_id: profile.company_id,
          name: campaign_name || `Importação ${new Date().toLocaleDateString()}`,
          message_template: sanitizedTemplate,
          status: 'scheduled',
          leads_total: results.imported_leads.length,
          created_by: user.id,
          delay_seconds: delay_seconds,
        })
        .select()
        .single();

      if (campaignError) {
        console.error('Erro ao criar campanha:', campaignError);
      } else {
        campaignId = campaign.id;

        // Agendar mensagens
        const now = new Date();
        const campaignMessages = results.imported_leads.map((lead, index) => ({
          campaign_id: campaign.id,
          lead_id: lead.id,
          scheduled_at: new Date(now.getTime() + (index * delay_seconds * 1000)).toISOString(),
        }));

        await supabase
          .from('whatsapp_campaign_messages')
          .insert(campaignMessages);

        console.log(`Campanha criada: ${campaign.id} com ${campaignMessages.length} mensagens`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: results,
        campaign_id: campaignId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    const errorResponse = mapGenericError(error);
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
