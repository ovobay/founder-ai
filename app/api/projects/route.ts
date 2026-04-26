// Backend route for saving, loading, updating, and deleting projects.
// This file runs on the server only.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Save a project
export async function POST(req: Request) {
  try {
    const { idea, mode, result, user_id } = await req.json();

    if (!idea || !mode || !result || !user_id) {
      return Response.json(
        { error: "Missing idea, mode, result, or user_id." },
        { status: 400 }
      );
    }

    // Insert project and force Supabase to return the saved row
    const { data, error } = await supabase
      .from("projects")
      .insert({
        idea,
        mode,
        result,
        user_id,
        title: idea.slice(0, 50).replace(/\.$/, ""),
      })
      .select("*")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data?.id) {
      return Response.json(
        { error: "Supabase did not return a saved project ID." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      project: data,
      message: `Saved project with ID: ${data.id}`,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// GET: Load projects for one user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return Response.json({ projects: [] });
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ projects: data || [] });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH: Update project title
export async function PATCH(req: Request) {
  try {
    const { id, title } = await req.json();

    const { error } = await supabase
      .from("projects")
      .update({ title })
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE: Delete project
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}