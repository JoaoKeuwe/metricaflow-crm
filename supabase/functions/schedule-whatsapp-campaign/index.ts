import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar mensagens pendentes para envio
    const now = new Date().toISOString();
    
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('whatsapp_campaign_messages')
      .select(`
        *,
        campaign:whatsapp_campaigns(*),
        lead:leads(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(10); // Processar 10 por vez para evitar sobrecarga

    if (fetchError) {
      console.error('Erro ao buscar mensagens:', fetchError);
      throw fetchError;
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma mensagem pendente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${pendingMessages.length} mensagens...`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    // Configuração Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE');
    const evolutionApiKey = Deno.env.get('BERNARDO');

    if (!evolutionUrl || !evolutionInstance || !evolutionApiKey) {
      throw new Error('Configuração do WhatsApp incompleta');
    }

    for (const message of pendingMessages) {
      try {
        const { campaign, lead } = message;

        if (!lead || !lead.phone) {
          await supabase
            .from('whatsapp_campaign_messages')
            .update({ 
              status: 'skipped',
              error_message: 'Lead sem telefone' 
            })
            .eq('id', message.id);
          results.skipped++;
          continue;
        }

        // Personalizar mensagem (substituir variáveis)
        let personalizedMessage = campaign.message_template
          .replace(/\{nome\}/gi, lead.name)
          .replace(/\{empresa\}/gi, lead.company || '')
          .replace(/\{email\}/gi, lead.email || '');

        const cleanPhone = lead.phone.replace(/\D/g, '');

        // Enviar via Evolution API
        const evolutionResponse = await fetch(
          `${evolutionUrl}/message/sendText/${evolutionInstance}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              number: cleanPhone,
              text: personalizedMessage,
            }),
          }
        );

        if (!evolutionResponse.ok) {
          const errorText = await evolutionResponse.text();
          console.error(`Erro ao enviar para ${cleanPhone}:`, errorText);
          
          await supabase
            .from('whatsapp_campaign_messages')
            .update({ 
              status: 'failed',
              error_message: `Evolution API: ${evolutionResponse.statusText}` 
            })
            .eq('id', message.id);
          
          results.failed++;
          continue;
        }

        const evolutionData = await evolutionResponse.json();

        // Salvar mensagem enviada
        const { data: savedMessage } = await supabase
          .from('whatsapp_messages')
          .insert({
            company_id: campaign.company_id,
            lead_id: lead.id,
            phone: cleanPhone,
            message: personalizedMessage,
            direction: 'sent',
            status: 'sent',
            created_by: campaign.created_by,
            evolution_message_id: evolutionData.key?.id || null,
          })
          .select()
          .single();

        // Atualizar status da mensagem da campanha
        await supabase
          .from('whatsapp_campaign_messages')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            whatsapp_message_id: savedMessage?.id || null,
          })
          .eq('id', message.id);

        results.sent++;
        console.log(`Mensagem enviada para ${lead.name} (${cleanPhone})`);

        // Atualizar status da campanha se necessário
        const { data: stats } = await supabase
          .rpc('get_campaign_stats', { _campaign_id: campaign.id })
          .single();

        if (stats && typeof stats === 'object' && 'pending' in stats) {
          const allSent = (stats as any).pending === 0;
          if (allSent && campaign.status === 'running') {
            await supabase
              .from('whatsapp_campaigns')
              .update({ 
                status: 'completed',
                finished_at: new Date().toISOString() 
              })
              .eq('id', campaign.id);
          }
        }

        // Delay entre envios (anti-spam)
        await new Promise(resolve => setTimeout(resolve, campaign.delay_seconds * 1000));

      } catch (error: any) {
        console.error('Erro ao processar mensagem:', error);
        await supabase
          .from('whatsapp_campaign_messages')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .eq('id', message.id);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingMessages.length,
        results: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
