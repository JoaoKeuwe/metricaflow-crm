import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the calling user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if calling user is super admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('company_id, is_super_admin')
      .eq('id', callingUser.id)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ emails: {} }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body (may be empty for super admin requests)
    let userIds: string[] = [];
    try {
      const body = await req.json();
      userIds = body?.userIds || [];
    } catch {
      // Body may be empty for super admin requests
    }

    // If super admin and no userIds provided, return ALL user emails
    if (callerProfile.is_super_admin && (!userIds || userIds.length === 0)) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      
      const emails: Array<{ id: string; email: string }> = [];
      authUsers?.users?.forEach(u => {
        if (u.email) {
          emails.push({ id: u.id, email: u.email });
        }
      });

      return new Response(JSON.stringify({ emails }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if calling user is owner
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (!callerRole || callerRole.role !== 'gestor_owner') {
      return new Response(JSON.stringify({ emails: {} }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ emails: {} }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify all requested users belong to the same company
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company_id', callerProfile.company_id)
      .in('id', userIds);

    const validUserIds = profiles?.map(p => p.id) || [];

    // Fetch emails from auth for valid users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const emails: Record<string, string> = {};
    authUsers?.users?.forEach(u => {
      if (validUserIds.includes(u.id) && u.email) {
        emails[u.id] = u.email;
      }
    });

    return new Response(JSON.stringify({ emails }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ emails: {} }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
