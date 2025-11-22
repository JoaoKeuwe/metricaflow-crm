import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { mapDatabaseError, mapApiError, mapGenericError } from '../_shared/error-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SendMessageSchema = z.object({
  lead_id: z.string().uuid('ID de lead inválido').optional(),
  phone: z.string().min(1, 'Telefone é obrigatório').regex(/^\+?[\d\s\-()]+$/, 'Formato de telefone inválido'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(4096, 'Mensagem muito longa (máximo 4096 caracteres)'),
  media_url: z.string().url('URL de mídia inválida').optional(),
  media_type: z.string().optional(),
});

type SendMessageRequest = z.infer<typeof SendMessageSchema>;

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

    const rawPayload = await req.json();
    const validationResult = SendMessageSchema.safeParse(rawPayload);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors[0].message;
      throw new Error(errorMsg);
    }

    const { lead_id, phone, message, media_url, media_type } = validationResult.data;

    // Validar caracteres perigosos (prevenir XSS)
    const dangerousPatterns = /<script|javascript:|onerror=|onclick=|<iframe/i;
    if (dangerousPatterns.test(message)) {
      throw new Error('Mensagem contém caracteres ou padrões não permitidos');
    }

    // HTML encode para segurança adicional
    const sanitizedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Limpar telefone (remover caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log('Enviando mensagem para:', cleanPhone);

    // Preparar payload para Evolution API (usar mensagem original, não sanitizada)
    const evolutionPayload: any = {
      number: cleanPhone,
      text: message, // Evolution API recebe texto puro
    };

    if (media_url) {
      evolutionPayload.mediaMessage = {
        mediaUrl: media_url,
        mediaType: media_type || 'image',
      };
    }

    // Enviar via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE');
    const evolutionApiKey = Deno.env.get('BERNARDO'); // API key da Evolution
    
    if (!evolutionUrl || !evolutionInstance || !evolutionApiKey) {
      throw new Error('Configuração do WhatsApp incompleta');
    }

    const evolutionResponse = await fetch(
      `${evolutionUrl}/message/sendText/${evolutionInstance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify(evolutionPayload),
      }
    );

    if (!evolutionResponse.ok) {
      const apiError = mapApiError(evolutionResponse, 'WhatsApp');
      return new Response(
        JSON.stringify(apiError),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const evolutionData = await evolutionResponse.json();
    console.log('Resposta da Evolution:', evolutionData);

    // Salvar mensagem no banco de dados (com sanitização)
    const { data: messageData, error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        company_id: profile.company_id,
        lead_id: lead_id || null,
        phone: cleanPhone,
        message: sanitizedMessage, // Armazenar versão sanitizada
        direction: 'sent',
        status: 'sent',
        media_url: media_url || null,
        media_type: media_type || null,
        created_by: user.id,
        evolution_message_id: evolutionData.key?.id || null,
      })
      .select()
      .single();

    if (messageError) {
      const errorResponse = mapDatabaseError(messageError);
      return new Response(
        JSON.stringify(errorResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: messageData,
        evolution_response: evolutionData,
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
