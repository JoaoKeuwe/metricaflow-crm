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

    // Validate basic input
    if (!token || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: "missing_fields",
          message: "Token e senha são obrigatórios" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate password strength
    if (password.length < 12) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: "weak_password",
          message: "A senha deve ter no mínimo 12 caracteres" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: "token_invalid",
          message: "Token inválido ou expirado. Por favor, solicite um novo link de redefinição de senha." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
        return new Response(
          JSON.stringify({ 
            success: false, 
            code: "weak_password",
            message: "Esta senha é muito fraca ou está em uma lista de senhas comprometidas. Por favor, escolha uma senha mais forte e única que você não tenha usado antes." 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: "update_failed",
          message: "Erro ao atualizar senha. Por favor, tente novamente." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Password updated successfully for user:", tokenData.user_id);

    // Mark token as used only on success
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
    // Unexpected errors only
    console.error("Unexpected error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        code: "internal_error",
        message: "Erro interno do servidor. Por favor, tente novamente mais tarde." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
