import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { checkRateLimit, getClientIP } from '../_shared/rate-limit.ts';
import { mapDatabaseError, mapGenericError } from '../_shared/error-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  estimated_value?: number;
  assigned_to?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: 60 requests per minute per IP
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(supabase, clientIP, {
      maxRequests: 60,
      windowSeconds: 60,
      endpoint: 'create-lead-from-external'
    });

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Limite de requisições excedido. Tente novamente mais tarde.',
          retryAfter: rateLimit.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 60)
          } 
        }
      );
    }

    // Extrair token do header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autorização ausente ou inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Recebendo requisição com token:', token.substring(0, 10) + '...');

    // Validar token e obter company_id
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('id, company_id, active')
      .eq('token', token)
      .eq('active', true)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token inválido ou inativo:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou inativo' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { company_id, id: api_token_id } = tokenData;
    console.log('Token válido para company_id:', company_id);

    // Atualizar last_used_at do token
    await supabase
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', api_token_id);

    // Parse do payload
    const payload: LeadPayload = await req.json();
    console.log('Payload recebido:', payload);

    // Validações básicas
    if (!payload.name || payload.name.trim().length === 0) {
      const errorMsg = 'Campo "name" é obrigatório';
      console.error(errorMsg);
      
      await supabase.from('integration_logs').insert({
        company_id,
        api_token_id,
        source: 'api',
        payload,
        status: 'error',
        error_message: errorMsg,
      });

      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar email se fornecido
    if (payload.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.email)) {
        const errorMsg = 'Email inválido';
        console.error(errorMsg, payload.email);
        
        await supabase.from('integration_logs').insert({
          company_id,
          api_token_id,
          source: 'api',
          payload,
          status: 'error',
          error_message: errorMsg,
        });

        return new Response(
          JSON.stringify({ success: false, error: errorMsg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar duplicidade por email
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('company_id', company_id)
        .eq('email', payload.email)
        .single();

      if (existingLead) {
        const errorMsg = 'Lead com este email já existe na empresa';
        console.warn(errorMsg, payload.email);
        
        await supabase.from('integration_logs').insert({
          company_id,
          api_token_id,
          source: 'api',
          payload,
          status: 'error',
          error_message: errorMsg,
          lead_id: existingLead.id,
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMsg,
            existing_lead_id: existingLead.id 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Normalizar telefone (remover caracteres não numéricos)
    let normalizedPhone = payload.phone;
    if (normalizedPhone) {
      normalizedPhone = normalizedPhone.replace(/\D/g, '');
    }

    // Preparar dados do lead
    const leadData: any = {
      company_id,
      name: payload.name.trim(),
      email: payload.email?.trim() || null,
      phone: normalizedPhone || null,
      company: payload.company?.trim() || null,
      source: payload.source?.trim() || 'API/Google Sheets',
      estimated_value: payload.estimated_value || null,
      status: 'novo',
    };

    // Se assigned_to for fornecido, validar que o usuário existe e pertence à mesma empresa
    if (payload.assigned_to) {
      const { data: assignedUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', payload.assigned_to)
        .eq('company_id', company_id)
        .eq('active', true)
        .single();

      if (assignedUser) {
        leadData.assigned_to = payload.assigned_to;
      } else {
        console.warn('assigned_to inválido, criando lead sem atribuição');
      }
    }

    // Criar lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      const errorResponse = mapDatabaseError(leadError);
      
      await supabase.from('integration_logs').insert({
        company_id,
        api_token_id,
        source: 'api',
        payload,
        status: 'error',
        error_message: errorResponse.error,
      });

      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead criado com sucesso:', newLead.id);

    // Registrar log de sucesso
    await supabase.from('integration_logs').insert({
      company_id,
      api_token_id,
      source: 'api',
      payload,
      status: 'success',
      lead_id: newLead.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: newLead.id,
        message: 'Lead criado com sucesso' 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorResponse = mapGenericError(error);
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
