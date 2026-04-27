// Secure Stripe Checkout subscription route.
// Frontend sends Supabase access token.
// Backend verifies the real user, then creates Stripe subscription checkout.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!process.env.STRIPE_PRO_PRICE_ID) {
      return Response.json(
        { error: "Missing STRIPE_PRO_PRICE_ID." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data: usage } = await supabaseAdmin
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = usage?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabaseAdmin.from("usage_limits").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          plan: usage?.plan || "free",
          generations: usage?.generations || 0,
        },
        { onConflict: "user_id" }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],

      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],

      success_url: appUrl,
      cancel_url: appUrl,

      metadata: {
        user_id: user.id,
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}