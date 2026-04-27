// Creates a Stripe Billing Portal session
// Allows user to manage/cancel their subscription

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

    const { data: usage } = await supabaseAdmin
      .from("usage_limits")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!usage?.stripe_customer_id) {
      return Response.json(
        { error: "No Stripe customer found." },
        { status: 400 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: usage.stripe_customer_id,
      return_url:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });

    return Response.json({ url: portal.url });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}