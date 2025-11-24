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
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado');
    }

    const companyId = profile.company_id;

    console.log(`Updating avatars for demo salespeople in company: ${companyId}`);

    // Mapeamento de nomes para avatares
    const avatarMapping = [
      { name: 'Ana Paula Silva', avatar_url: 'https://i.pravatar.cc/150?img=47' },
      { name: 'Carlos Eduardo Santos', avatar_url: 'https://i.pravatar.cc/150?img=12' },
      { name: 'Juliana Oliveira', avatar_url: 'https://i.pravatar.cc/150?img=32' },
      { name: 'Roberto Ferreira', avatar_url: 'https://i.pravatar.cc/150?img=51' },
      { name: 'Marina Costa', avatar_url: 'https://i.pravatar.cc/150?img=44' }
    ];

    const updatedProfiles = [];

    // Atualizar cada vendedor
    for (const mapping of avatarMapping) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: mapping.avatar_url })
        .eq('company_id', companyId)
        .ilike('name', mapping.name)
        .select();

      if (updateError) {
        console.error(`Error updating avatar for ${mapping.name}:`, updateError);
        continue;
      }

      if (updated && updated.length > 0) {
        console.log(`Updated avatar for ${mapping.name}`);
        updatedProfiles.push(updated[0]);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Avatares atualizados para ${updatedProfiles.length} vendedores`,
        profiles: updatedProfiles
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in update-demo-avatars:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
