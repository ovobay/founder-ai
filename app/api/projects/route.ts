import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CreateProjectBody = {
  name?: unknown;
  description?: unknown;
};

function normalizeCreateProjectBody(body: CreateProjectBody) {
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : null;

  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  return {
    name,
    description,
  };
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_projects")
    .select(
      `
      id,
      owner_user_id,
      name,
      description,
      status,
      created_at,
      updated_at
    `
    )
    .eq("owner_user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({
    projects: data ?? [],
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  let body: CreateProjectBody;

  try {
    body = (await request.json()) as CreateProjectBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const normalized = normalizeCreateProjectBody(body);

  if (!normalized.name) {
    return jsonError("Project name is required.", 400);
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_projects")
    .insert({
      owner_user_id: user.id,
      name: normalized.name,
      description: normalized.description,
      status: "active",
    })
    .select(
      `
      id,
      owner_user_id,
      name,
      description,
      status,
      created_at,
      updated_at
    `
    )
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk(
    {
      project: data,
    },
    201
  );
}