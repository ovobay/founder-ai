import {
  getAuthenticatedUser,
  getSupabaseAdmin,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

type UpdateFileBody = {
  path?: unknown;
  contents?: unknown;
  description?: unknown;
  status?: unknown;
};

type FounderProjectFile = {
  id: string;
  project_id: string;
  owner_user_id: string;
  path: string;
  contents: string;
  description: string | null;
  status: "created" | "updated" | "checked" | "deleted";
  last_build_id: string | null;
  created_at: string;
  updated_at: string;
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

function normalizeFileStatus(
  value: unknown
): "created" | "updated" | "checked" | "deleted" | null {
  if (
    value === "created" ||
    value === "updated" ||
    value === "checked" ||
    value === "deleted"
  ) {
    return value;
  }

  return null;
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

function normalizeUpdateFileBody(body: UpdateFileBody) {
  const pathValidation =
    typeof body.path === "string" ? validateProjectFilePath(body.path) : null;

  const contents =
    typeof body.contents === "string" ? body.contents : undefined;

  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : undefined;

  const status = normalizeFileStatus(body.status);

  return {
    pathValidation,
    contents,
    description,
    status,
  };
}

async function getOwnedFile(fileId: string, ownerUserId: string) {
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
    .eq("id", fileId)
    .eq("owner_user_id", ownerUserId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as FounderProjectFile;
}

async function checkPathConflict({
  projectId,
  ownerUserId,
  fileId,
  path,
}: {
  projectId: string;
  ownerUserId: string;
  fileId: string;
  path: string;
}) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_project_files")
    .select("id, path, status")
    .eq("project_id", projectId)
    .eq("owner_user_id", ownerUserId)
    .eq("path", path)
    .neq("id", fileId)
    .neq("status", "deleted")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  const { fileId } = await context.params;

  if (!fileId) {
    return jsonError("File ID is required.", 400);
  }

  const file = await getOwnedFile(fileId, user.id);

  if (!file) {
    return jsonError("File not found.", 404);
  }

  return jsonOk({
    file,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  const { fileId } = await context.params;

  if (!fileId) {
    return jsonError("File ID is required.", 400);
  }

  const existingFile = await getOwnedFile(fileId, user.id);

  if (!existingFile) {
    return jsonError("File not found.", 404);
  }

  let body: UpdateFileBody;

  try {
    body = (await request.json()) as UpdateFileBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const normalized = normalizeUpdateFileBody(body);

  const updatePayload: Record<string, unknown> = {};

  if (normalized.pathValidation) {
    if (!normalized.pathValidation.ok) {
      return jsonError(normalized.pathValidation.error ?? "Invalid file path.", 400);
    }

    const nextPath = normalized.pathValidation.path;

    if (nextPath !== existingFile.path) {
      try {
        const hasConflict = await checkPathConflict({
          projectId: existingFile.project_id,
          ownerUserId: user.id,
          fileId,
          path: nextPath,
        });

        if (hasConflict) {
          return jsonError("Another active file already uses this path.", 409);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to check file path conflict.";

        return jsonError(message, 500);
      }

      updatePayload.path = nextPath;
    }
  }

  if (normalized.contents !== undefined) {
    updatePayload.contents = normalized.contents;
  }

  if (normalized.description !== undefined) {
    updatePayload.description = normalized.description;
  }

  if (normalized.status !== null) {
    updatePayload.status = normalized.status;
  }

  if (Object.keys(updatePayload).length === 0) {
    return jsonError("No valid file fields were provided.", 400);
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_project_files")
    .update(updatePayload)
    .eq("id", fileId)
    .eq("owner_user_id", user.id)
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
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Failed to update file.", 500);
  }

  return jsonOk({
    file: data,
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  const { fileId } = await context.params;

  if (!fileId) {
    return jsonError("File ID is required.", 400);
  }

  const existingFile = await getOwnedFile(fileId, user.id);

  if (!existingFile) {
    return jsonError("File not found.", 404);
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("founder_project_files")
    .update({
      status: "deleted",
    })
    .eq("id", fileId)
    .eq("owner_user_id", user.id)
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
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Failed to delete file.", 500);
  }

  return jsonOk({
    file: data,
  });
}