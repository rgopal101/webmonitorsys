import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES_INR: Record<string, { amount: number; name: string; max_domains: number; max_emails: number }> = {
  starter: { amount: 99, name: "Starter Plan", max_domains: 5, max_emails: 2 },
  professional: { amount: 499, name: "Professional Plan", max_domains: 10, max_emails: 5 },
  unlimited: { amount: 1499, name: "Unlimited Plan", max_domains: 999, max_emails: 999 },
};

async function getRazorpayConfig() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.from("razorpay_settings").select("*").maybeSingle();
  if (error || !data) throw new Error("Razorpay settings not configured. Please configure in admin settings.");
  if (!data.key_id || !data.key_secret) throw new Error("Razorpay credentials are empty.");
  return { keyId: data.key_id, keySecret: data.key_secret };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, user_id, customer_name, customer_email, customer_contact } = await req.json();

    if (!plan || !PLAN_PRICES_INR[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planInfo = PLAN_PRICES_INR[plan];
    const { keyId, keySecret } = await getRazorpayConfig();

    // Create Razorpay order
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: planInfo.amount * 100, // Razorpay expects paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          user_id,
          plan,
          plan_name: planInfo.name,
        },
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(`Razorpay order failed: ${JSON.stringify(orderData)}`);

    // Store pending payment record
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("payments").insert({
      user_id,
      amount: planInfo.amount,
      currency: "INR",
      payment_method: "razorpay",
      order_id: orderData.id,
      status: "pending",
      plan,
      metadata: { plan_name: planInfo.name, customer_name, customer_email },
    });

    return new Response(JSON.stringify({
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      key_id: keyId,
      plan_name: planInfo.name,
      prefill: {
        name: customer_name || "",
        email: customer_email || "",
        contact: customer_contact || "",
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
