// Secure project API.
// The frontend sends a Supabase access token.
// The backend verifies that token and gets the real user ID itself.

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the real logged-in user from the Authorization header
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

// Save a project
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { idea, mode, result } = await req.json();

    if (!idea || !mode || !result) {
      return Response.json(
        { error: "Missing idea, mode, or result." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        idea,
        mode,
        result,
        user_id: user.id,
        title: idea.slice(0, 50).replace(/\.$/, ""),
      })
      .select("*")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, project: data });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// Load current user's projects
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ projects: data || [] });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// Update current user's project title
export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, title } = await req.json();

    const { error } = await supabaseAdmin
      .from("projects")
      .update({ title })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// Delete current user's project
export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await req.json();

    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}