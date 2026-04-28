import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type FounderProject = {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

async function findLatestActiveProject(ownerUserId: string) {
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
    .eq("owner_user_id", ownerUserId)
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as FounderProject | null;
}

async function createDefaultProject(ownerUserId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_projects")
    .insert({
      owner_user_id: ownerUserId,
      name: "Founder AI Workspace",
      description:
        "Default workspace for generated SaaS products, websites, Shopify apps, CRM tools, AI tools, marketplaces, marketing systems, internal tools, and future mobile applications.",
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
    throw new Error(error.message);
  }

  return data as FounderProject;
}

async function getProjectBuilds(projectId: string, ownerUserId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_builds")
    .select(
      `
      id,
      project_id,
      owner_user_id,
      prompt,
      project_type,
      classification,
      modules,
      architecture,
      files,
      preview_state,
      status,
      created_at,
      restored_at
    `
    )
    .eq("project_id", projectId)
    .eq("owner_user_id", ownerUserId)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getProjectFiles(projectId: string, ownerUserId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_project_files")
    .select(
      `
      id,
      project_id,
      owner_user_id,
      path,
      contents,
      description,
      status,
      last_build_id,
      created_at,
      updated_at
    `
    )
    .eq("project_id", projectId)
    .eq("owner_user_id", ownerUserId)
    .neq("status", "deleted")
    .order("path", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  try {
    const existingProject = await findLatestActiveProject(user.id);
    const project = existingProject ?? (await createDefaultProject(user.id));
    const builds = await getProjectBuilds(project.id, user.id);
    const projectFiles = await getProjectFiles(project.id, user.id);

    return jsonOk({
      project,
      builds,
      projectFiles,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load current project.";

    return jsonError(message, 500);
  }
}