import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado');
    }

    const companyId = profile.company_id;

    console.log(`Creating 5 demo salespeople for company: ${companyId}`);

    // Vendedores fictícios com avatares
    const salespeople = [
      { name: 'Ana Paula Silva', email: 'ana.silva@demo.com', password: 'Demo@2024', avatar_url: 'https://i.pravatar.cc/150?img=47' },
      { name: 'Carlos Eduardo Santos', email: 'carlos.santos@demo.com', password: 'Demo@2024', avatar_url: 'https://i.pravatar.cc/150?img=12' },
      { name: 'Juliana Oliveira', email: 'juliana.oliveira@demo.com', password: 'Demo@2024', avatar_url: 'https://i.pravatar.cc/150?img=32' },
      { name: 'Roberto Ferreira', email: 'roberto.ferreira@demo.com', password: 'Demo@2024', avatar_url: 'https://i.pravatar.cc/150?img=51' },
      { name: 'Marina Costa', email: 'marina.costa@demo.com', password: 'Demo@2024', avatar_url: 'https://i.pravatar.cc/150?img=44' }
    ];

    const createdUsers = [];

    // Create users
    for (const person of salespeople) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', person.name)
        .single();

      if (existingUser) {
        console.log(`User ${person.name} already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }

      // Create auth user
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: person.email,
        password: person.password,
        email_confirm: true,
        user_metadata: {
          name: person.name,
          company_id: companyId,
          role: 'vendedor'
        }
      });

      if (createError) {
        console.error(`Error creating user ${person.name}:`, createError);
        continue;
      }

      console.log(`Created user: ${person.name} (${person.email})`);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          company_id: companyId,
          name: person.name,
          avatar_url: person.avatar_url,
          active: true
        });

      if (profileError) {
        console.error(`Error creating profile for ${person.name}:`, profileError);
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'vendedor'
        });

      if (roleError) {
        console.error(`Error creating role for ${person.name}:`, roleError);
      }

      createdUsers.push({ id: authUser.user.id, name: person.name, email: person.email });
    }

    console.log(`Created ${createdUsers.length} salespeople, now generating data...`);

    // Now generate demo data for all users
    const { data: generateData, error: generateError } = await supabase.functions.invoke('seed-demo-data', {
      headers: {
        Authorization: authHeader
      }
    });

    if (generateError) {
      console.error('Error generating demo data:', generateError);
      throw generateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        salespeople: createdUsers,
        demoDataStats: generateData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-demo-salespeople:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
