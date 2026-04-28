import OpenAI from "openai";
import {
  getAuthenticatedUser,
  jsonError,
  jsonOk,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProjectType = string;

type Complexity = "simple" | "standard" | "advanced" | "enterprise";

type BuildClassification = {
  primaryCategory: string;
  secondaryCategories: string[];
  industry: string | null;
  platformTargets: string[];
  complexity: Complexity;
};

type DetectedModule = {
  id: string;
  label: string;
  description: string;
};

type SchemaTable = {
  id: string;
  name: string;
  purpose: string;
  fields: string[];
};

type ApiEndpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
};

type SecurityRule = {
  id: string;
  label: string;
  description: string;
};

type ArchitecturePlan = {
  tables: SchemaTable[];
  endpoints: ApiEndpoint[];
  securityRules: SecurityRule[];
};

type GeneratedFile = {
  id: string;
  path: string;
  status: "created" | "updated" | "checked";
  description: string;
  contents: string;
};

type PreviewState = {
  title: string;
  subtitle: string;
  projectType: string;
  fileCount: number;
  status: string;
  lastUpdatedLabel: string;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
};

type GenerateBuildResult = {
  projectType: ProjectType;
  classification: BuildClassification;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: GeneratedFile[];
  previewState: PreviewState;
  summary: string;
  changes: string[];
};

type GenerateBuildBody = {
  prompt?: unknown;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

const ALLOWED_COMPLEXITIES: Complexity[] = [
  "simple",
  "standard",
  "advanced",
  "enterprise",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

function parseComplexity(value: unknown): Complexity {
  if (
    typeof value === "string" &&
    ALLOWED_COMPLEXITIES.includes(value as Complexity)
  ) {
    return value as Complexity;
  }

  return "standard";
}

function parseClassification(
  value: unknown,
  prompt: string,
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

  const primaryCategory = safeString(
    value.primaryCategory,
    projectType || "Custom software product"
  );

  const secondaryCategories = safeStringArray(value.secondaryCategories);

  const industry =
    typeof value.industry === "string" && value.industry.trim().length > 0
      ? value.industry.trim()
      : null;

  const platformTargets = safeStringArray(value.platformTargets);

  return {
    primaryCategory,
    secondaryCategories,
    industry,
    platformTargets: platformTargets.length > 0 ? platformTargets : ["web"],
    complexity: parseComplexity(value.complexity),
  };
}

function parseProjectType(value: unknown, prompt: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return slugify(value);
  }

  return slugify(prompt) || "custom-software-product";
}

function parseModules(value: unknown): DetectedModule[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): DetectedModule | null => {
      if (!isRecord(item)) return null;

      const label = safeString(item.label, `Module ${index + 1}`);

      return {
        id: slugify(safeString(item.id, label)) || `module-${index}`,
        label,
        description: safeString(item.description, "Generated product module."),
      };
    })
    .filter((item): item is DetectedModule => item !== null);
}

function parseArchitecture(value: unknown): ArchitecturePlan {
  if (!isRecord(value)) {
    return {
      tables: [],
      endpoints: [],
      securityRules: [],
    };
  }

  const tables = Array.isArray(value.tables)
    ? value.tables
        .map((item, index): SchemaTable | null => {
          if (!isRecord(item)) return null;

          const name = safeString(item.name, `generated_table_${index}`);

          return {
            id: slugify(safeString(item.id, name)) || `table-${index}`,
            name,
            purpose: safeString(item.purpose, "Generated database table."),
            fields: safeStringArray(item.fields),
          };
        })
        .filter((item): item is SchemaTable => item !== null)
    : [];

  const endpoints = Array.isArray(value.endpoints)
    ? value.endpoints
        .map((item, index): ApiEndpoint | null => {
          if (!isRecord(item)) return null;

          const method =
            item.method === "GET" ||
            item.method === "POST" ||
            item.method === "PATCH" ||
            item.method === "DELETE"
              ? item.method
              : "GET";

          const path = safeString(item.path, `/api/generated/${index}`);

          return {
            id: slugify(safeString(item.id, `${method}-${path}`)) || `endpoint-${index}`,
            method,
            path,
            purpose: safeString(item.purpose, "Generated API endpoint."),
          };
        })
        .filter((item): item is ApiEndpoint => item !== null)
    : [];

  const securityRules = Array.isArray(value.securityRules)
    ? value.securityRules
        .map((item, index): SecurityRule | null => {
          if (!isRecord(item)) return null;

          const label = safeString(item.label, `Security rule ${index + 1}`);

          return {
            id: slugify(safeString(item.id, label)) || `security-${index}`,
            label,
            description: safeString(
              item.description,
              "Generated security control."
            ),
          };
        })
        .filter((item): item is SecurityRule => item !== null)
    : [];

  return {
    tables,
    endpoints,
    securityRules,
  };
}

function parseFiles(value: unknown): GeneratedFile[] {
  if (!Array.isArray(value)) return [];

  const seenPaths = new Set<string>();

  return value
    .map((item, index): GeneratedFile | null => {
      if (!isRecord(item)) return null;

      const validation = validateProjectFilePath(item.path);

      if (!validation.ok || !validation.path) {
        return null;
      }

      if (seenPaths.has(validation.path)) {
        return null;
      }

      seenPaths.add(validation.path);

      const status =
        item.status === "created" ||
        item.status === "updated" ||
        item.status === "checked"
          ? item.status
          : "created";

      return {
        id: slugify(safeString(item.id, validation.path)) || `generated-file-${index}`,
        path: validation.path,
        status,
        description: safeString(item.description, "Generated project file."),
        contents: safeString(item.contents, `// ${validation.path}\n`),
      };
    })
    .filter((item): item is GeneratedFile => item !== null);
}

function buildFallbackFile(prompt: string): GeneratedFile {
  return {
    id: "fallback-readme",
    path: "README.md",
    status: "created",
    description:
      "Fallback project brief generated when AI output was incomplete.",
    contents: `# Generated Project Brief

Prompt:

${prompt}

The AI response did not include valid project files, so this fallback file was created.
`,
  };
}

function createPreviewStateFallback({
  prompt,
  projectType,
  classification,
  modules,
  architecture,
  fileCount,
}: {
  prompt: string;
  projectType: string;
  classification: BuildClassification;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  fileCount: number;
}): PreviewState {
  return {
    title: classification.primaryCategory || "Generated Product Workspace",
    subtitle: prompt,
    projectType,
    fileCount,
    status: "AI build generated",
    lastUpdatedLabel: "AI generated",
    modules,
    architecture,
  };
}

function parsePreviewState(
  value: unknown,
  prompt: string,
  projectType: string,
  classification: BuildClassification,
  modules: DetectedModule[],
  architecture: ArchitecturePlan,
  fileCount: number
): PreviewState {
  if (!isRecord(value)) {
    return createPreviewStateFallback({
      prompt,
      projectType,
      classification,
      modules,
      architecture,
      fileCount,
    });
  }

  return {
    title: safeString(value.title, classification.primaryCategory),
    subtitle: safeString(value.subtitle, prompt),
    projectType: safeString(value.projectType, projectType),
    fileCount:
      typeof value.fileCount === "number" && Number.isFinite(value.fileCount)
        ? value.fileCount
        : fileCount,
    status: safeString(value.status, "AI build generated"),
    lastUpdatedLabel: safeString(value.lastUpdatedLabel, "AI generated"),
    modules,
    architecture,
  };
}

function normalizeGeneratedBuild(
  value: unknown,
  prompt: string
): GenerateBuildResult {
  if (!isRecord(value)) {
    const projectType = slugify(prompt) || "custom-software-product";
    const classification: BuildClassification = {
      primaryCategory: "Custom software product",
      secondaryCategories: [],
      industry: null,
      platformTargets: ["web"],
      complexity: "standard",
    };

    const modules: DetectedModule[] = [
      {
        id: "core-app",
        label: "Core app",
        description: "Generated fallback module.",
      },
    ];

    const architecture: ArchitecturePlan = {
      tables: [],
      endpoints: [],
      securityRules: [],
    };

    const files = [buildFallbackFile(prompt)];

    return {
      projectType,
      classification,
      modules,
      architecture,
      files,
      previewState: createPreviewStateFallback({
        prompt,
        projectType,
        classification,
        modules,
        architecture,
        fileCount: files.length,
      }),
      summary: "Fallback build generated.",
      changes: ["Generated fallback README because the AI output was incomplete."],
    };
  }

  const projectType = parseProjectType(value.projectType, prompt);
  const classification = parseClassification(
    value.classification,
    prompt,
    projectType
  );

  const parsedModules = parseModules(value.modules);
  const modules =
    parsedModules.length > 0
      ? parsedModules
      : [
          {
            id: "core-app",
            label: "Core app",
            description: "Generated core application module.",
          },
        ];

  const architecture = parseArchitecture(value.architecture);

  let files = parseFiles(value.files);

  if (files.length === 0) {
    files = [buildFallbackFile(prompt)];
  }

  const previewState = parsePreviewState(
    value.previewState,
    prompt,
    projectType,
    classification,
    modules,
    architecture,
    files.length
  );

  const summary = safeString(
    value.summary,
    `Generated a ${classification.primaryCategory} build from the prompt.`
  );

  const changes = safeStringArray(value.changes);

  return {
    projectType,
    classification,
    modules,
    architecture,
    files,
    previewState,
    summary,
    changes:
      changes.length > 0
        ? changes
        : [
            "Classified the product dynamically from the prompt.",
            "Generated project architecture, modules, starter files, and preview state.",
          ],
  };
}

function getSystemPrompt() {
  return `
You are the code generation planner for Founder AI, a real-world software builder platform.

Return ONLY valid JSON. No markdown. No commentary.

The user may ask for any kind of product:
- SaaS platform
- marketplace
- AI tool
- AI UGC ad generator
- CRM
- ERP
- booking system
- learning platform
- healthcare portal
- church/charity platform
- school management system
- logistics app
- ecommerce system
- Shopify store
- Shopify app
- marketing automation engine
- internal IT command center
- finance dashboard
- job board
- real estate platform
- restaurant ordering app
- legal document generator
- news/media platform
- analytics dashboard
- API backend
- browser extension
- mobile app
- or anything else.

Do NOT force the product into a small fixed category list.
Infer a projectType slug dynamically from the prompt.

Return this exact JSON shape:
{
  "projectType": "dynamic-kebab-case-product-type",
  "classification": {
    "primaryCategory": "Human-readable product category",
    "secondaryCategories": ["Related category"],
    "industry": "Industry name or null",
    "platformTargets": ["web", "api", "admin-dashboard"],
    "complexity": "simple" | "standard" | "advanced" | "enterprise"
  },
  "modules": [
    {
      "id": "string-kebab-case",
      "label": "Human label",
      "description": "Short practical description"
    }
  ],
  "architecture": {
    "tables": [
      {
        "id": "string-kebab-case",
        "name": "snake_case_table_name",
        "purpose": "What this stores",
        "fields": ["id", "created_at"]
      }
    ],
    "endpoints": [
      {
        "id": "string-kebab-case",
        "method": "GET" | "POST" | "PATCH" | "DELETE",
        "path": "/api/example",
        "purpose": "What this endpoint does"
      }
    ],
    "securityRules": [
      {
        "id": "string-kebab-case",
        "label": "Short label",
        "description": "Specific security rule"
      }
    ]
  },
  "files": [
    {
      "id": "string-kebab-case",
      "path": "app/page.tsx",
      "status": "created" | "updated" | "checked",
      "description": "What this file does",
      "contents": "Full useful starter code or config"
    }
  ],
  "previewState": {
    "title": "Product title",
    "subtitle": "Short product description",
    "projectType": "Human project type",
    "fileCount": 1,
    "status": "AI build generated",
    "lastUpdatedLabel": "AI generated"
  },
  "summary": "Short practical summary of what was generated",
  "changes": ["Important change 1", "Important change 2"]
}

File path rules:
- Paths must be relative project paths.
- Allowed top folders: app, components, config, lib, public, styles, supabase, types, utils.
- Allowed extensions: .ts, .tsx, .js, .jsx, .json, .css, .scss, .md, .mdx, .sql, .html, .txt, .env.example.
- Do not use absolute paths.
- Do not use ../.
- Do not use duplicate paths.

Generation rules:
- Generate 5 to 10 useful starter files.
- Prefer Next.js App Router, TypeScript, Supabase, Stripe, OpenAI, and modern SaaS architecture where relevant.
- If the product is not SaaS, still generate the right architecture for that product.
- If the prompt implies mobile, include mobile as a platform target but explain that native mobile generation can be a later phase if needed.
- If the prompt implies Shopify, include Shopify OAuth, webhook, Admin API, theme/storefront, or billing planning as relevant.
- If the prompt implies marketing/lead generation, use compliant OAuth/API-based sourcing and avoid scraping, spam, credential theft, or platform-policy abuse.
- Do not generate malicious, credential-stealing, scraping-abuse, spam, phishing, malware, evasion, or policy-violating code.
- Make files practical enough to become a real project scaffold.
`;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError("Unauthorized. Missing or invalid session.", 401);
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonError("OPENAI_API_KEY is not configured.", 500);
  }

  let body: GenerateBuildBody;

  try {
    body = (await request.json()) as GenerateBuildBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const prompt =
    typeof body.prompt === "string" && body.prompt.trim().length > 0
      ? body.prompt.trim()
      : null;

  if (!prompt) {
    return jsonError("Prompt is required.", 400);
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-5.5",
      input: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const outputText = response.output_text;

    if (!outputText) {
      return jsonError("AI returned an empty response.", 500);
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(outputText) as unknown;
    } catch {
      return jsonError("AI returned invalid JSON.", 500);
    }

    const normalized = normalizeGeneratedBuild(parsed, prompt);

    return jsonOk({
      build: normalized,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate AI build.";

    return jsonError(message, 500);
  }
}