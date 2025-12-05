import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Mapeamento de planos para Price IDs do Stripe
const PLAN_PRICES: Record<string, { priceId: string; userLimit: number }> = {
  individual_monthly: { priceId: "price_1SamnuCkhjlgO62pwUHObmpi", userLimit: 1 },
  individual_yearly: { priceId: "price_1SamoCCkhjlgO62pmVGeKwIJ", userLimit: 1 },
  team_monthly: { priceId: "price_1SamoPCkhjlgO62p7hqzv0oG", userLimit: 10 },
  team_yearly: { priceId: "price_1SamoaCkhjlgO62pbIhPcttD", userLimit: 10 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planType } = await req.json();
    logStep("Plan type received", { planType });

    if (!planType || !PLAN_PRICES[planType]) {
      throw new Error("Invalid plan type");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const planConfig = PLAN_PRICES[planType];
    const origin = req.headers.get("origin") || "https://workflow360.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/settings?tab=subscription&success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        user_limit: planConfig.userLimit.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
