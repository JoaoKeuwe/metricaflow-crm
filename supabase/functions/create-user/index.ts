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
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if calling user is gestor_owner
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (!callerRole || callerRole.role !== 'gestor_owner') {
      return new Response(JSON.stringify({ error: 'Apenas o dono da conta pode criar usuários' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get caller's company
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('id', callingUser.id)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: 'Perfil não encontrado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyId = callerProfile.company_id;

    // Get subscription and user limit
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type, user_limit, status')
      .eq('company_id', companyId)
      .single();

    // Count current active users in company (excluding owner)
    const { count: currentUsers } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('active', true);

    const userLimit = subscription?.user_limit || 1;
    const planType = subscription?.plan_type || 'free';

    // Individual plans can only have 1 user (the owner)
    if (planType.includes('individual') || planType === 'free') {
      return new Response(JSON.stringify({ 
        error: 'Plano Individual: Não é possível adicionar usuários adicionais' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if limit reached
    if (currentUsers && currentUsers >= userLimit) {
      return new Response(JSON.stringify({ 
        error: `Limite de ${userLimit} usuários atingido` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { name, email, password, role } = await req.json();

    // Validate inputs
    if (!name || name.trim().length < 1 || name.trim().length > 100) {
      return new Response(JSON.stringify({ error: 'Nome deve ter entre 1 e 100 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!password || password.length < 12) {
      return new Response(JSON.stringify({ error: 'Senha deve ter no mínimo 12 caracteres' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!role || !['gestor', 'vendedor'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Função deve ser gestor ou vendedor' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if email is already used in this company
    const { data: existingUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company_id', companyId);

    if (existingUsers && existingUsers.length > 0) {
      const existingUserIds = existingUsers.map(u => u.id);
      
      // Check if any of these users have the same email
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailExists = authUsers?.users?.some(u => 
        existingUserIds.includes(u.id) && u.email?.toLowerCase() === email.toLowerCase()
      );

      if (emailExists) {
        return new Response(JSON.stringify({ 
          error: 'Este email já está em uso nesta empresa' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if email exists globally in Supabase Auth
    const { data: globalCheck } = await supabaseAdmin.auth.admin.listUsers();
    const emailExistsGlobally = globalCheck?.users?.some(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExistsGlobally) {
      return new Response(JSON.stringify({ 
        error: 'Este email já está cadastrado no sistema. Use outro email.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Creating user: ${email} with role: ${role} for company: ${companyId}`);

    // Create the user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        company_id: companyId,
        role: role
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ 
        error: createError.message || 'Erro ao criar usuário' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!newUser?.user) {
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`User created successfully: ${newUser.user.id}`);

    // The profile and role should be created by the trigger, but let's verify
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify profile was created
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, company_id')
      .eq('id', newUser.user.id)
      .single();

    if (!profile) {
      console.log('Profile not created by trigger, creating manually');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          company_id: companyId,
          name: name.trim()
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    // Verify role was created
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', newUser.user.id)
      .single();

    if (!userRole) {
      console.log('Role not created by trigger, creating manually');
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role
        });

      if (roleError) {
        console.error('Error creating role:', roleError);
      }
    } else if (userRole.role !== role) {
      // Update role if different from what trigger created
      const { error: updateRoleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: role })
        .eq('user_id', newUser.user.id);

      if (updateRoleError) {
        console.error('Error updating role:', updateRoleError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        name: name.trim(),
        role: role
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
