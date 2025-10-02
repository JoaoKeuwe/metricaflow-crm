import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is owner
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "gestor_owner") {
      throw new Error("Only owners can create users");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error("User has no company");
    }

    // Get request body
    const { name, email, password, role } = await req.json();

    // Validate inputs
    if (!name || !email || !password || !role) {
      throw new Error("Missing required fields");
    }

    if (!["gestor", "vendedor"].includes(role)) {
      throw new Error("Invalid role");
    }

    // Check email uniqueness in company
    const { data: emailIsUnique, error: rpcError } = await supabaseAdmin.rpc("is_email_unique_in_company", {
      _email: email,
      _company_id: profile.company_id,
    });

    console.log('Email uniqueness check:', { email, emailIsUnique, rpcError });

    if (rpcError) {
      console.error('RPC error checking email:', rpcError);
      throw new Error("Error checking email availability");
    }

    if (emailIsUnique === false) {
      console.log('Email already exists:', email);
      throw new Error("Email already exists in this company");
    }

    // Check user limit
    const { data: userCount } = await supabaseAdmin.rpc("count_additional_users", {
      _company_id: profile.company_id,
    });

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("user_limit_adicionais")
      .eq("id", profile.company_id)
      .single();

    const limit = company?.user_limit_adicionais || 10;

    if (userCount >= limit) {
      throw new Error(`User limit reached (${limit} additional users)`);
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        company_id: profile.company_id,
        role,
      },
    });

    if (createError) {
      throw createError;
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
