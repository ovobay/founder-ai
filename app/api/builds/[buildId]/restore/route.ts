import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    buildId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid bearer token.", 401);
  }

  const { buildId } = await context.params;

  if (!buildId) {
    return jsonError("Build ID is required.", 400);
  }

  const supabase = getSupabaseAdmin();

  const { data: existingBuild, error: existingBuildError } = await supabase
    .from("founder_builds")
    .select(
      `
      id,
      project_id,
      owner_user_id,
      prompt,
      project_type,
      modules,
      architecture,
      files,
      preview_state,
      status,
      created_at,
      restored_at
    `
    )
    .eq("id", buildId)
    .eq("owner_user_id", user.id)
    .single();

  if (existingBuildError || !existingBuild) {
    return jsonError("Build not found.", 404);
  }

  const { data: restoredBuild, error: restoreError } = await supabase
    .from("founder_builds")
    .update({
      status: "restored",
      restored_at: new Date().toISOString(),
    })
    .eq("id", buildId)
    .eq("owner_user_id", user.id)
    .select(
      `
      id,
      project_id,
      owner_user_id,
      prompt,
      project_type,
      modules,
      architecture,
      files,
      preview_state,
      status,
      created_at,
      restored_at
    `
    )
    .single();

  if (restoreError || !restoredBuild) {
    return jsonError(restoreError?.message ?? "Failed to restore build.", 500);
  }

  return jsonOk({
    build: restoredBuild,
  });
}