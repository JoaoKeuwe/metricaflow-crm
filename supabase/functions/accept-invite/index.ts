import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInviteRequest {
  token: string;
  name: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { token, name, password }: AcceptInviteRequest = await req.json();

    console.log('Processing invite acceptance:', { token, name });

    // Validate invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select("*, companies(name)")
      .eq("id", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      console.error('Invite not found or invalid:', inviteError);
      throw new Error("Convite inválido ou já utilizado");
    }

    // Check if invite is expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      console.error('Invite expired:', { expiresAt });
      throw new Error("Convite expirado");
    }

    console.log('Valid invite found:', { email: invite.email, companyId: invite.company_id, role: invite.role });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        company_id: invite.company_id,
        role: invite.role,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      throw new Error(authError?.message || "Erro ao criar usuário");
    }

    console.log('User created successfully:', { userId: authData.user.id });

    // Mark invite as accepted
    const { error: updateError } = await supabaseAdmin
      .from("invites")
      .update({ status: "accepted" })
      .eq("id", token);

    if (updateError) {
      console.error('Error updating invite status:', updateError);
      // Not critical, user was created successfully
    }

    console.log('Invite marked as accepted');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: authData.user.id, 
          email: authData.user.email 
        } 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in accept-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
