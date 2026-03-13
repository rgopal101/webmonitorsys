import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, { max_domains: number; max_emails: number }> = {
  starter: { max_domains: 5, max_emails: 2 },
  professional: { max_domains: 10, max_emails: 5 },
  unlimited: { max_domains: 999, max_emails: 999 },
};

async function getPayPalAccessToken() {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";
    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${order_id}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await captureRes.json();
    if (!captureRes.ok) throw new Error(`PayPal capture failed: ${JSON.stringify(captureData)}`);

    if (captureData.status !== "COMPLETED") {
      return new Response(JSON.stringify({ error: "Payment not completed", status: captureData.status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user_id and plan from custom_id
    const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
      || captureData.purchase_units?.[0]?.custom_id;
    
    if (!customId) throw new Error("Missing custom_id in PayPal order");
    
    const [userId, plan] = customId.split("|");
    const limits = PLAN_LIMITS[plan];
    if (!limits) throw new Error(`Unknown plan: ${plan}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        plan,
        status: "active",
        payment_provider: "paypal",
        paypal_subscription_id: order_id,
        max_domains: limits.max_domains,
        max_emails: limits.max_emails,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Re-enable website tracking
    await supabase
      .from("websites")
      .update({ tracking_enabled: true })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ success: true, plan, period_end: periodEnd.toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
