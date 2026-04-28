import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CreateBuildBody = {
  prompt?: unknown;
  projectType?: unknown;
  classification?: unknown;
  modules?: unknown;
  architecture?: unknown;
  files?: unknown;
  previewState?: unknown;
};

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

type NormalizedGeneratedFile = {
  id: string;
  path: string;
  status: "created" | "updated" | "checked";
  description: string;
  contents: string;
};

type BuildClassification = {
  primaryCategory: string;
  secondaryCategories: string[];
  industry: string | null;
  platformTargets: string[];
  complexity: "simple" | "standard" | "advanced" | "enterprise";
};

const ALLOWED_COMPLEXITIES = [
  "simple",
  "standard",
  "advanced",
  "enterprise",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeComplexity(
  value: unknown
): "simple" | "standard" | "advanced" | "enterprise" {
  if (
    typeof value === "string" &&
    ALLOWED_COMPLEXITIES.includes(
      value as "simple" | "standard" | "advanced" | "enterprise"
    )
  ) {
    return value as "simple" | "standard" | "advanced" | "enterprise";
  }

  return "standard";
}

function normalizeClassification(
  value: unknown,
  projectType: string
): BuildClassification {
  if (!isRecord(value)) {
    return {
      primaryCategory: projectType || "Custom software product",
      secondaryCategories: [],
      industry: null,
      platformTargets: ["web"],
      complexity: "standard",
    };
  }

  return {
    primaryCategory: safeString(
      value.primaryCategory,
      projectType || "Custom software product"
    ),
    secondaryCategories: safeStringArray(value.secondaryCategories),
    industry:
      typeof value.industry === "string" && value.industry.trim().length > 0
        ? value.industry.trim()
        : null,
    platformTargets:
      safeStringArray(value.platformTargets).length > 0
        ? safeStringArray(value.platformTargets)
        : ["web"],
    complexity: normalizeComplexity(value.complexity),
  };
}

function normalizeFileStatus(
  value: unknown
): "created" | "updated" | "checked" {
  if (value === "created" || value === "updated" || value === "checked") {
    return value;
  }

  return "updated";
}

function normalizeGeneratedFiles(value: unknown): NormalizedGeneratedFile[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): NormalizedGeneratedFile | null => {
      if (!isRecord(item)) return null;

      const path =
        typeof item.path === "string" && item.path.trim().length > 0
          ? item.path.trim()
          : null;

      if (!path) return null;

      return {
        id:
          typeof item.id === "string" && item.id.trim().length > 0
            ? item.id.trim()
            : `file-${index}`,
        path,
        status: normalizeFileStatus(item.status),
        description:
          typeof item.description === "string"
            ? item.description
            : "Generated project file.",
        contents: typeof item.contents === "string" ? item.contents : "",
      };
    })
    .filter((file): file is NormalizedGeneratedFile => file !== null);
}

function normalizeCreateBuildBody(body: CreateBuildBody) {
  const prompt =
    typeof body.prompt === "string" && body.prompt.trim().length > 0
      ? body.prompt.trim()
      : null;

  const projectType =
    typeof body.projectType === "string" && body.projectType.trim().length > 0
      ? body.projectType.trim()
      : null;

  const modules = Array.isArray(body.modules) ? body.modules : [];
  const architecture = isRecord(body.architecture) ? body.architecture : {};
  const files = normalizeGeneratedFiles(body.files);
  const previewState = isRecord(body.previewState) ? body.previewState : {};
  const classification = normalizeClassification(
    body.classification,
    projectType ?? "Custom software product"
  );

  return {
    prompt,
    projectType,
    classification,
    modules,
    architecture,
    files,
    previewState,
  };
}

async function verifyProjectOwnership(projectId: string, ownerUserId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_projects")
    .select("id, owner_user_id")
    .eq("id", projectId)
    .eq("owner_user_id", ownerUserId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

async function upsertLatestProjectFiles({
  projectId,
  ownerUserId,
  buildId,
  files,
}: {
  projectId: string;
  ownerUserId: string;
  buildId: string;
  files: NormalizedGeneratedFile[];
}) {
  if (files.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();

  const rows = files.map((file) => ({
    project_id: projectId,
    owner_user_id: ownerUserId,
    path: file.path,
    contents: file.contents,
    description: file.description,
    status: file.status,
    last_build_id: buildId,
  }));

  const { data, error } = await supabase
    .from("founder_project_files")
    .upsert(rows, {
      onConflict: "project_id,path",
    })
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
    .order("path", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  const { projectId } = await context.params;

  if (!projectId) {
    return jsonError("Project ID is required.", 400);
  }

  const ownsProject = await verifyProjectOwnership(projectId, user.id);

  if (!ownsProject) {
    return jsonError("Project not found.", 404);
  }

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
    .eq("owner_user_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({
    builds: data ?? [],
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  const { projectId } = await context.params;

  if (!projectId) {
    return jsonError("Project ID is required.", 400);
  }

  const ownsProject = await verifyProjectOwnership(projectId, user.id);

  if (!ownsProject) {
    return jsonError("Project not found.", 404);
  }

  let body: CreateBuildBody;

  try {
    body = (await request.json()) as CreateBuildBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const normalized = normalizeCreateBuildBody(body);

  if (!normalized.prompt) {
    return jsonError("Build prompt is required.", 400);
  }

  if (!normalized.projectType) {
    return jsonError("Project type is required.", 400);
  }

  const supabase = getSupabaseAdmin();

  const { data: build, error: buildError } = await supabase
    .from("founder_builds")
    .insert({
      project_id: projectId,
      owner_user_id: user.id,
      prompt: normalized.prompt,
      project_type: normalized.projectType,
      classification: normalized.classification,
      modules: normalized.modules,
      architecture: normalized.architecture,
      files: normalized.files,
      preview_state: normalized.previewState,
      status: "completed",
    })
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
    .single();

  if (buildError || !build) {
    return jsonError(buildError?.message ?? "Failed to create build.", 500);
  }

  try {
    const projectFiles = await upsertLatestProjectFiles({
      projectId,
      ownerUserId: user.id,
      buildId: build.id,
      files: normalized.files,
    });

    return jsonOk(
      {
        build,
        projectFiles,
      },
      201
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Build was created, but project files could not be updated.";

    return jsonError(message, 500);
  }
}