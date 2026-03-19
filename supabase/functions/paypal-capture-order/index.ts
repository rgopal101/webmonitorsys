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

async function getPayPalConfig() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.from("paypal_settings").select("*").maybeSingle();
  if (error || !data) throw new Error("PayPal settings not configured.");
  if (!data.client_id || !data.client_secret) throw new Error("PayPal credentials are empty.");

  const baseUrl = data.mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  return { clientId: data.client_id, clientSecret: data.client_secret, baseUrl };
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret, baseUrl } = await getPayPalConfig();

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
  return { accessToken: data.access_token, baseUrl };
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

    const { accessToken, baseUrl } = await getPayPalAccessToken();

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

    // Store payment record
    const captureAmount = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    await supabase.from("payments").insert({
      user_id: userId,
      amount: parseFloat(captureAmount?.value || "0"),
      currency: captureAmount?.currency_code || "USD",
      payment_method: "paypal",
      transaction_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || order_id,
      order_id: order_id,
      status: "completed",
      plan,
      metadata: { paypal_status: captureData.status },
    });

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
