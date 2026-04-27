import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

type FileItem = {
  path: string;
  content: string;
};

type FixRequestBody = {
  files: FileItem[];
  diagnostics?: {
    error?: string | null;
    reason?: string | null;
    logs?: string | null;
    htmlSnippet?: string | null;
    pageFile?: string | null;
    layoutFile?: string | null;
    packageFile?: string | null;
    container?: string | null;
    status?: number | null;
  } | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

function normalizePath(filePath: string) {
  return filePath
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .replace(/\\/g, "/")
    .trim();
}

function rebuildProject(files: FileItem[]) {
  return files
    .map((file) => `FILE: ${normalizePath(file.path)}\n${file.content}`)
    .join("\n\n");
}

function parseFiles(text?: string): FileItem[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  const files: FileItem[] = [];
  const parts = text.split("FILE:");

  for (let part of parts) {
    part = part.trim();

    if (!part) {
      continue;
    }

    const firstLineEnd = part.indexOf("\n");

    if (firstLineEnd === -1) {
      continue;
    }

    const filePath = normalizePath(part.substring(0, firstLineEnd).trim());
    const content = part.substring(firstLineEnd + 1).trim();

    if (!filePath || !content) {
      continue;
    }

    files.push({
      path: filePath,
      content,
    });
  }

  return files;
}

function hasFile(files: FileItem[], filePath: string) {
  return files.some((file) => normalizePath(file.path) === filePath);
}

function getFile(files: FileItem[], filePath: string) {
  return files.find((file) => normalizePath(file.path) === filePath);
}

function safePackageJson() {
  return JSON.stringify(
    {
      name: "founder-ai-generated-project",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: "14.2.23",
        react: "18.3.1",
        "react-dom": "18.3.1",
      },
      devDependencies: {
        "@types/node": "20.17.12",
        "@types/react": "18.3.18",
        "@types/react-dom": "18.3.5",
        typescript: "5.7.2",
        tailwindcss: "3.4.17",
        postcss: "8.4.49",
        autoprefixer: "10.4.20",
      },
    },
    null,
    2
  );
}

function normalizePackageJson(content: string) {
  try {
    const pkg = JSON.parse(content);

    return JSON.stringify(
      {
        ...pkg,
        scripts: {
          ...(pkg.scripts || {}),
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          ...(pkg.dependencies || {}),
          next: "14.2.23",
          react: "18.3.1",
          "react-dom": "18.3.1",
        },
        devDependencies: {
          ...(pkg.devDependencies || {}),
          "@types/node": "20.17.12",
          "@types/react": "18.3.18",
          "@types/react-dom": "18.3.5",
          typescript: "5.7.2",
          tailwindcss: "3.4.17",
          postcss: "8.4.49",
          autoprefixer: "10.4.20",
        },
      },
      null,
      2
    );
  } catch {
    return safePackageJson();
  }
}

function sanitizeFileContent(filePath: string, content: string) {
  let next = content;

  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
    const needsClient =
      next.includes("useState(") ||
      next.includes("useEffect(") ||
      next.includes("useRef(") ||
      next.includes("useRouter(") ||
      next.includes("useSearchParams(") ||
      next.includes("onClick=") ||
      next.includes("onSubmit=") ||
      next.includes("onChange=") ||
      next.includes("onMouseEnter=") ||
      next.includes("onMouseLeave=");

    const trimmed = next.trimStart();

    if (
      needsClient &&
      !trimmed.startsWith('"use client";') &&
      !trimmed.startsWith("'use client';")
    ) {
      next = `"use client";\n\n${next}`;
    }
  }

  return next;
}

function ensureBaseFiles(files: FileItem[]) {
  let finalFiles = files
    .map((file) => ({
      path: normalizePath(file.path),
      content: String(file.content || ""),
    }))
    .filter((file) => file.path && file.content)
    .filter(
      (file) =>
        file.path !== "next.config.ts" &&
        file.path !== "next.config.js"
    )
    .map((file) => {
      if (file.path === "package.json") {
        return {
          ...file,
          content: normalizePackageJson(file.content),
        };
      }

      return {
        ...file,
        content: sanitizeFileContent(file.path, file.content),
      };
    });

  if (!hasFile(finalFiles, "package.json")) {
    finalFiles.push({
      path: "package.json",
      content: safePackageJson(),
    });
  }

  if (!hasFile(finalFiles, "app/layout.tsx")) {
    finalFiles.push({
      path: "app/layout.tsx",
      content: `import "./globals.css";

export const metadata = {
  title: "Founder AI Generated Project",
  description: "Generated by Founder AI Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    });
  }

  if (!hasFile(finalFiles, "app/page.tsx")) {
    finalFiles.push({
      path: "app/page.tsx",
      content: `export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-black">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Generated by Founder AI
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Repaired Preview Project
        </h1>

        <p className="mt-5 text-lg leading-8 text-gray-600">
          The previous preview error was repaired and this fallback page is now visible.
        </p>
      </div>
    </main>
  );
}
`,
    });
  }

  if (!hasFile(finalFiles, "app/globals.css")) {
    finalFiles.push({
      path: "app/globals.css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: white;
  color: #111111;
}
`,
    });
  }

  if (!hasFile(finalFiles, "postcss.config.mjs")) {
    finalFiles.push({
      path: "postcss.config.mjs",
      content: `const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`,
    });
  }

  if (!hasFile(finalFiles, "tailwind.config.ts")) {
    finalFiles.push({
      path: "tailwind.config.ts",
      content: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`,
    });
  }

  if (!hasFile(finalFiles, "tsconfig.json")) {
    finalFiles.push({
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: false,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [
              {
                name: "next",
              },
            ],
            paths: {
              "@/*": ["./*"],
            },
          },
          include: [
            "next-env.d.ts",
            "**/*.ts",
            "**/*.tsx",
            ".next/types/**/*.ts",
          ],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
    });
  }

  if (!hasFile(finalFiles, "next-env.d.ts")) {
    finalFiles.push({
      path: "next-env.d.ts",
      content: `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file was generated by Founder AI.
`,
    });
  }

  if (!hasFile(finalFiles, "next.config.mjs")) {
    finalFiles.push({
      path: "next.config.mjs",
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`,
    });
  }

  return finalFiles;
}

function hasHydrationRisk(text: string) {
  const riskyPatterns = [
    "Math.random(",
    "Date.now(",
    "new Date(",
    "window.",
    "document.",
    "localStorage",
    "sessionStorage",
    "navigator.",
    "suppressHydrationWarning",
    "dangerouslySetInnerHTML",
  ];

  return riskyPatterns.some((pattern) => text.includes(pattern));
}

function getRepairPrompt(files: FileItem[], diagnostics: FixRequestBody["diagnostics"]) {
  const currentProject = rebuildProject(files);

  return `
You are Founder AI Repair Agent.

You repair broken generated Next.js projects.

You must return the full repaired project using ONLY FILE blocks.

Do not use markdown fences.
Do not explain.
Do not write commentary.
Only return FILE blocks.

CURRENT PROJECT:
${currentProject}

PREVIEW DIAGNOSTICS:
Error:
${diagnostics?.error || "No error provided"}

Reason:
${diagnostics?.reason || "No reason provided"}

Status:
${diagnostics?.status || "No status provided"}

Container:
${diagnostics?.container || "No container provided"}

Docker logs:
${diagnostics?.logs || "No logs provided"}

HTML snippet:
${diagnostics?.htmlSnippet || "No HTML snippet provided"}

Generated app/page.tsx from container:
${diagnostics?.pageFile || "No page file provided"}

Generated app/layout.tsx from container:
${diagnostics?.layoutFile || "No layout file provided"}

Generated package.json from container:
${diagnostics?.packageFile || "No package file provided"}

REPAIR RULES:
- Fix the actual error from the logs.
- Return a complete runnable project.
- Keep the user's original product intent.
- Do not remove important product sections unless necessary.
- Every import must point to an existing file.
- Do not use unsupported Next config files.
- Use next.config.mjs, never next.config.ts.
- Pin package versions:
  next: "14.2.23"
  react: "18.3.1"
  react-dom: "18.3.1"
  tailwindcss: "3.4.17"
  postcss: "8.4.49"
  autoprefixer: "10.4.20"
  typescript: "5.7.2"
- Use Tailwind v3-compatible CSS:
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
- Use PostCSS config:
  tailwindcss: {}
  autoprefixer: {}
- Do not use Tailwind v4 syntax.
- Do not use Math.random(), Date.now(), new Date(), window, document, localStorage, sessionStorage, or navigator during render.
- Server Components must not use event handlers.
- If a file uses useState/useEffect/onClick/onSubmit/onChange, add "use client"; as the first line.
- Prefer static visible UI.
- app/page.tsx must visibly render real content.
- Do not return null from visible components.
- Do not produce blank pages.

OUTPUT FORMAT:
FILE: package.json
<contents>

FILE: app/layout.tsx
<contents>

FILE: app/page.tsx
<contents>

Continue for every file needed.
`;
}

function mergeRepairedFiles(originalFiles: FileItem[], repairedFiles: FileItem[]) {
  const merged = [...originalFiles];

  for (const repaired of repairedFiles) {
    const safePath = normalizePath(repaired.path);
    const existingIndex = merged.findIndex(
      (file) => normalizePath(file.path) === safePath
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        path: safePath,
        content: repaired.content,
      };
    } else {
      merged.push({
        path: safePath,
        content: repaired.content,
      });
    }
  }

  return merged;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as FixRequestBody;

    if (!Array.isArray(body.files) || body.files.length === 0) {
      return Response.json(
        { error: "No project files provided." },
        { status: 400 }
      );
    }

    const safeFiles = body.files.map((file) => ({
      path: normalizePath(String(file.path || "")),
      content: String(file.content || ""),
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a senior Next.js repair engineer. Return only valid FILE blocks.",
        },
        {
          role: "user",
          content: getRepairPrompt(safeFiles, body.diagnostics),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const repairedFiles = parseFiles(raw);

    if (repairedFiles.length === 0) {
      return Response.json(
        {
          error: "Repair failed: AI did not return valid FILE blocks.",
          raw,
        },
        { status: 500 }
      );
    }

    let mergedFiles = mergeRepairedFiles(safeFiles, repairedFiles);
    mergedFiles = ensureBaseFiles(mergedFiles);

    const fullResult = rebuildProject(mergedFiles);

    if (hasHydrationRisk(fullResult)) {
      return Response.json(
        {
          error:
            "Repair failed: repaired project still contains hydration-risk patterns.",
          result: fullResult,
        },
        { status: 500 }
      );
    }

    return Response.json({
      result: fullResult,
      files: mergedFiles,
    });
  } catch (error) {
    return Response.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}