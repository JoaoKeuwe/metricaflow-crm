import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campanha não encontrada");
    }

    // Atualizar status para "sending"
    await supabase
      .from("whatsapp_campaigns")
      .update({ 
        status: "sending", 
        started_at: new Date().toISOString() 
      })
      .eq("id", campaignId);

    // Buscar destinatários pendentes
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select(`
        *,
        leads:lead_id (
          name,
          company,
          email
        )
      `)
      .eq("campaign_id", campaignId)
      .eq("status", "pending")
      .order("created_at");

    if (recipientsError || !recipients) {
      throw new Error("Erro ao buscar destinatários");
    }

    let sentCount = 0;
    let failedCount = 0;

    // Processar cada destinatário
    for (const recipient of recipients) {
      try {
        let messageToSend = campaign.message_template;

        // Personalizar mensagem com variáveis básicas
        const leadData = recipient.leads as any;
        messageToSend = messageToSend
          .replace(/\{nome\}/gi, leadData?.name || "")
          .replace(/\{empresa\}/gi, leadData?.company || "")
          .replace(/\{email\}/gi, leadData?.email || "");

        // Usar IA para personalização adicional se habilitado
        if (campaign.use_ai_personalization && lovableApiKey && campaign.ai_instructions) {
          try {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: `Você é um assistente de marketing que personaliza mensagens WhatsApp. 
                    Instruções específicas: ${campaign.ai_instructions}
                    
                    Mantenha a mensagem profissional, amigável e concisa.
                    IMPORTANTE: Retorne APENAS o texto da mensagem personalizada, sem explicações adicionais.`
                  },
                  {
                    role: "user",
                    content: `Personalize esta mensagem para o lead:
                    
                    Nome: ${leadData?.name || ""}
                    Empresa: ${leadData?.company || ""}
                    Email: ${leadData?.email || ""}
                    
                    Mensagem base:
                    ${messageToSend}`
                  }
                ],
                temperature: 0.7,
                max_tokens: 500
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const personalizedText = aiData.choices?.[0]?.message?.content;
              if (personalizedText) {
                messageToSend = personalizedText.trim();
              }
            }
          } catch (aiError) {
            console.error("Erro ao personalizar com IA:", aiError);
            // Continua com a mensagem base se a IA falhar
          }
        }

        // Atualizar mensagem personalizada
        await supabase
          .from("campaign_recipients")
          .update({ personalized_message: messageToSend })
          .eq("id", recipient.id);

        // Enviar mensagem via função existente
        const { error: sendError } = await supabase.functions.invoke(
          "send-whatsapp-message",
          {
            body: {
              phone: recipient.phone,
              message: messageToSend,
              leadId: recipient.lead_id,
            },
          }
        );

        if (sendError) {
          throw sendError;
        }

        // Atualizar status do destinatário
        await supabase
          .from("campaign_recipients")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", recipient.id);

        sentCount++;

        // Aguardar intervalo configurado
        if (campaign.interval_seconds > 0) {
          await new Promise(resolve => setTimeout(resolve, campaign.interval_seconds * 1000));
        }

      } catch (error) {
        console.error(`Erro ao enviar para ${recipient.phone}:`, error);
        
        await supabase
          .from("campaign_recipients")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Erro desconhecido",
          })
          .eq("id", recipient.id);

        failedCount++;
      }
    }

    // Atualizar campanha com resultados finais
    await supabase
      .from("whatsapp_campaigns")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        sent_count: campaign.sent_count + sentCount,
        failed_count: campaign.failed_count + failedCount,
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        failedCount,
        totalProcessed: sentCount + failedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao executar campanha:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});