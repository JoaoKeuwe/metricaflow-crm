import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== reset-user-password invoked ===");
  
  try {
    const { token, password }: ResetPasswordRequest = await req.json();
    console.log("Reset password request for token:", token);

    if (!token || !password) {
      throw new Error("Token e senha são obrigatórios");
    }

    // Validate password strength
    if (password.length < 12) {
      throw new Error("Senha deve ter no mínimo 12 caracteres");
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error("Invalid token:", tokenError);
      throw new Error("Token inválido ou expirado");
    }

    // Update user password using admin API
    const { data: userData, error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      
      // Handle specific error types
      if (updateError.message?.includes('weak') || updateError.message?.includes('pwned')) {
        throw new Error("Esta senha é muito fraca ou está em uma lista de senhas comprometidas. Por favor, escolha uma senha mais forte e única.");
      }
      
      throw new Error("Erro ao atualizar senha. Por favor, tente novamente.");
    }

    console.log("Password updated successfully for user:", tokenData.user_id);

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Senha atualizada com sucesso",
        user: userData.user 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
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
