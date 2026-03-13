import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, { amount: string; name: string; max_domains: number; max_emails: number }> = {
  starter: { amount: "1.00", name: "Starter Plan", max_domains: 5, max_emails: 2 },
  professional: { amount: "5.00", name: "Professional Plan", max_domains: 10, max_emails: 5 },
  unlimited: { amount: "15.00", name: "Unlimited Plan", max_domains: 999, max_emails: 999 },
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
    const { plan, user_id, return_url, cancel_url } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planInfo = PLAN_PRICES[plan];
    const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";
    const accessToken = await getPayPalAccessToken();

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          description: planInfo.name,
          custom_id: `${user_id}|${plan}`,
          amount: {
            currency_code: "USD",
            value: planInfo.amount,
          },
        }],
        application_context: {
          brand_name: "IsItOnlineOrNot.com",
          return_url: return_url || "https://webmonitorsys.lovable.app/my-dashboard?payment=success",
          cancel_url: cancel_url || "https://webmonitorsys.lovable.app/pricing?payment=cancelled",
        },
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(`PayPal order failed: ${JSON.stringify(orderData)}`);

    const approvalLink = orderData.links?.find((l: any) => l.rel === "approve")?.href;

    return new Response(JSON.stringify({ order_id: orderData.id, approval_url: approvalLink }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PayPal create order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
