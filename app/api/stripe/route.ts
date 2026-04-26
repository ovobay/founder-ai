// Creates Stripe Checkout session when user clicks "Upgrade to Pro"

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return Response.json({ error: "Missing user_id." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Founder AI Pro",
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],

      success_url: "http://localhost:3000",
      cancel_url: "http://localhost:3000",

      // This lets the webhook know which Supabase user paid
      metadata: {
        user_id,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}