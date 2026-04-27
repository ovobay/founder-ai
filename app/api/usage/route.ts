// Secure usage API.
// The backend verifies the Supabase access token and loads usage for the real user.

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the real logged-in user from Authorization: Bearer <token>
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

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
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