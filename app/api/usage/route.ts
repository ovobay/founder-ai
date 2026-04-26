// Loads the current user's plan and generation usage from Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return Response.json(
        { error: "Missing user_id." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({
        plan: "free",
        generations: 0,
        remaining: 5,
      });
    }

    const plan = data.plan || "free";
    const generations = data.generations || 0;

    return Response.json({
      plan,
      generations,
      remaining: plan === "pro" ? "unlimited" : Math.max(0, 5 - generations),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}