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

    const webhookData = await req.json();
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    // Validar se é uma mensagem recebida
    if (!webhookData.data || webhookData.event !== 'messages.upsert') {
      return new Response(
        JSON.stringify({ success: true, message: 'Evento ignorado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageData = webhookData.data;
    
    // Ignorar mensagens enviadas por nós
    if (messageData.key?.fromMe) {
      return new Response(
        JSON.stringify({ success: true, message: 'Mensagem própria ignorada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair dados da mensagem
    const phone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const messageText = messageData.message?.conversation || 
                       messageData.message?.extendedTextMessage?.text || 
                       '[Mídia]';
    const messageId = messageData.key?.id;

    console.log('Processando mensagem de:', phone);

    // Buscar lead pelo telefone
    const { data: leads } = await supabase
      .from('leads')
      .select('id, company_id')
      .or(`phone.eq.${phone},phone.eq.+${phone},phone.ilike.%${phone}%`)
      .limit(1);

    const lead = leads && leads.length > 0 ? leads[0] : null;

    if (!lead) {
      console.log('Lead não encontrado para o telefone:', phone);
      return new Response(
        JSON.stringify({ success: true, message: 'Lead não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar mensagem recebida
    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        company_id: lead.company_id,
        lead_id: lead.id,
        phone: phone,
        message: messageText,
        direction: 'received',
        status: 'read',
        evolution_message_id: messageId,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar mensagem:', saveError);
      throw saveError;
    }

    console.log('Mensagem salva:', savedMessage.id);

    // Atualizar contador de respostas em campanhas ativas
    const { data: campaignMessages } = await supabase
      .from('whatsapp_campaign_messages')
      .select('campaign_id')
      .eq('lead_id', lead.id)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1);

    if (campaignMessages && campaignMessages.length > 0) {
      await supabase
        .from('whatsapp_campaigns')
        .update({ 
          leads_responded: supabase.rpc('increment', { x: 1 }) 
        })
        .eq('id', campaignMessages[0].campaign_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem processada',
        saved_message_id: savedMessage.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
