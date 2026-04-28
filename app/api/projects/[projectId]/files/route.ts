import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

type UpsertFileBody = {
  path?: unknown;
  contents?: unknown;
  description?: unknown;
  status?: unknown;
};

type UpsertFilesBody = {
  files?: unknown;
};

type NormalizedFile = {
  path: string;
  contents: string;
  description: string | null;
  status: "created" | "updated" | "checked" | "deleted";
};

const ALLOWED_FILE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".md",
  ".mdx",
  ".sql",
  ".html",
  ".txt",
  ".env.example",
];

const ALLOWED_TOP_LEVEL_FOLDERS = [
  "app",
  "components",
  "config",
  "lib",
  "public",
  "styles",
  "supabase",
  "types",
  "utils",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFileStatus(
  value: unknown
): "created" | "updated" | "checked" | "deleted" {
  if (
    value === "created" ||
    value === "updated" ||
    value === "checked" ||
    value === "deleted"
  ) {
    return value;
  }

  return "updated";
}

function normalizePath(value: string) {
  return value
    .trim()
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/")
    .replace(/^\.?\//, "")
    .replace(/\/$/, "");
}

function hasAllowedExtension(path: string) {
  return ALLOWED_FILE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function validateProjectFilePath(value: unknown) {
  if (typeof value !== "string") {
    return {
      ok: false as const,
      error: "File path must be a string.",
      path: null,
    };
  }

  const path = normalizePath(value);

  if (!path) {
    return {
      ok: false as const,
      error: "File path is required.",
      path: null,
    };
  }

  if (path.length > 220) {
    return {
      ok: false as const,
      error: "File path is too long.",
      path: null,
    };
  }

  if (path.startsWith("/") || path.startsWith("~")) {
    return {
      ok: false as const,
      error: "File path must be relative to the project root.",
      path: null,
    };
  }

  if (path.includes("../") || path.includes("..\\")) {
    return {
      ok: false as const,
      error: "File path cannot traverse outside the project.",
      path: null,
    };
  }

  if (path.split("/").some((part) => part === ".." || part === "." || !part)) {
    return {
      ok: false as const,
      error: "File path contains invalid segments.",
      path: null,
    };
  }

  if (!/^[a-zA-Z0-9._/@-]+(\/[a-zA-Z0-9._/@-]+)*$/.test(path)) {
    return {
      ok: false as const,
      error:
        "File path can only contain letters, numbers, dots, dashes, underscores, @, and forward slashes.",
      path: null,
    };
  }

  const [topLevelFolder] = path.split("/");

  if (!topLevelFolder || !ALLOWED_TOP_LEVEL_FOLDERS.includes(topLevelFolder)) {
    return {
      ok: false as const,
      error: `File path must start with one of: ${ALLOWED_TOP_LEVEL_FOLDERS.join(
        ", "
      )}.`,
      path: null,
    };
  }

  if (!hasAllowedExtension(path)) {
    return {
      ok: false as const,
      error: `File path must end with one of: ${ALLOWED_FILE_EXTENSIONS.join(
        ", "
      )}.`,
      path: null,
    };
  }

  return {
    ok: true as const,
    error: null,
    path,
  };
}

function normalizeSingleFile(value: unknown): NormalizedFile | null {
  if (!isRecord(value)) return null;

  const pathValidation = validateProjectFilePath(value.path);

  if (!pathValidation.ok || !pathValidation.path) {
    throw new Error(pathValidation.error);
  }

  const contents = typeof value.contents === "string" ? value.contents : "";

  const description =
    typeof value.description === "string" &&
    value.description.trim().length > 0
      ? value.description.trim()
      : null;

  return {
    path: pathValidation.path,
    contents,
    description,
    status: normalizeFileStatus(value.status),
  };
}

function normalizeUpsertFilesBody(body: UpsertFilesBody) {
  if (!Array.isArray(body.files)) return [];

  return body.files
    .map(normalizeSingleFile)
    .filter((file): file is NormalizedFile => file !== null);
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

async function checkPathConflicts({
  projectId,
  ownerUserId,
  paths,
}: {
  projectId: string;
  ownerUserId: string;
  paths: string[];
}) {
  if (paths.length === 0) return [];

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_project_files")
    .select("id, path, status")
    .eq("project_id", projectId)
    .eq("owner_user_id", ownerUserId)
    .in("path", paths)
    .neq("status", "deleted");

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
    .eq("owner_user_id", user.id)
    .neq("status", "deleted")
    .order("path", {
      ascending: true,
    });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({
    files: data ?? [],
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

  let body: UpsertFileBody | UpsertFilesBody;

  try {
    body = (await request.json()) as UpsertFileBody | UpsertFilesBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  let files: NormalizedFile[];

  try {
    files = Array.isArray((body as UpsertFilesBody).files)
      ? normalizeUpsertFilesBody(body as UpsertFilesBody)
      : (() => {
          const singleFile = normalizeSingleFile(body);
          return singleFile ? [singleFile] : [];
        })();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid file payload.";

    return jsonError(message, 400);
  }

  if (files.length === 0) {
    return jsonError("At least one valid file is required.", 400);
  }

  const paths = files.map((file) => file.path);
  const duplicatePaths = paths.filter(
    (path, index) => paths.indexOf(path) !== index
  );

  if (duplicatePaths.length > 0) {
    return jsonError(
      `Duplicate file paths in request: ${[...new Set(duplicatePaths)].join(
        ", "
      )}.`,
      400
    );
  }

  try {
    const conflicts = await checkPathConflicts({
      projectId,
      ownerUserId: user.id,
      paths,
    });

    if (conflicts.length > 0) {
      return jsonError(
        `File already exists: ${conflicts.map((file) => file.path).join(", ")}.`,
        409
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to check file path conflicts.";

    return jsonError(message, 500);
  }

  const supabase = getSupabaseAdmin();

  const rows = files.map((file) => ({
    project_id: projectId,
    owner_user_id: user.id,
    path: file.path,
    contents: file.contents,
    description: file.description,
    status: file.status,
  }));

  const { data, error } = await supabase
    .from("founder_project_files")
    .insert(rows)
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
    return jsonError(error.message, 500);
  }

  return jsonOk(
    {
      files: data ?? [],
    },
    201
  );
}