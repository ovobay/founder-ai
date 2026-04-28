import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-ai-generate-build-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function die(message) {
  fs.writeFileSync(pagePath, source);
  throw new Error(message);
}

function updateBetween(label, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    die(`Could not find section: ${label}`);
  }

  source =
    source.slice(0, start) +
    replacement +
    "\n\n" +
    source.slice(end);
}

function insertAfter(label, marker, insertion) {
  if (source.includes(insertion.trim())) {
    console.log(`Skipping ${label}: already exists.`);
    return;
  }

  const index = source.indexOf(marker);

  if (index === -1) {
    die(`Could not find marker for: ${label}`);
  }

  const insertAt = index + marker.length;
  source =
    source.slice(0, insertAt) +
    "\n\n" +
    insertion +
    source.slice(insertAt);
}

/**
 * 1. Replace fixed ProjectType union with flexible string type.
 */
const projectTypeReplacement = `type ProjectType = string;

type BuildClassification = {
  primaryCategory: string;
  secondaryCategories: string[];
  industry: string | null;
  platformTargets: string[];
  complexity: "simple" | "standard" | "advanced" | "enterprise";
};`;

if (!source.includes("type BuildClassification = {")) {
  updateBetween(
    "ProjectType union",
    "type ProjectType =",
    "type BuildStepStatus =",
    `${projectTypeReplacement}\n\ntype BuildStepStatus =`
  );
  console.log("Updated ProjectType to flexible string.");
} else {
  console.log("ProjectType already flexible.");
}

/**
 * 2. Add AI generated build response type.
 */
const aiGeneratedBuildType = `type AiGeneratedBuild = {
  projectType: ProjectType;
  classification?: BuildClassification;
  modules: DetectedModule[];
  architecture: ArchitecturePlan;
  files: ChangedFile[];
  previewState: PreviewState;
  summary: string;
  changes: string[];
};`;

if (!source.includes("type AiGeneratedBuild = {")) {
  insertAfter(
    "AiGeneratedBuild type",
    `type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};`,
    aiGeneratedBuildType
  );
  console.log("Added AiGeneratedBuild type.");
} else {
  console.log("AiGeneratedBuild type already exists.");
}

/**
 * 3. Replace getProjectTypeLabel so unknown dynamic project types do not crash.
 */
const getProjectTypeLabelReplacement = `function getProjectTypeLabel(projectType: ProjectType): string {
  const labels: Record<string, string> = {
    "marketing-site": "Marketing site",
    saas: "SaaS",
    "web-app": "Web app",
    crm: "CRM",
    "shopify-store": "Shopify store",
    "shopify-app": "Shopify app",
    "marketing-engine": "Marketing engine",
    "mobile-app": "Mobile app",
  };

  if (labels[projectType]) {
    return labels[projectType];
  }

  return projectType
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Custom product";
}`;

updateBetween(
  "getProjectTypeLabel",
  "function getProjectTypeLabel(projectType: ProjectType): string {",
  "function includesAny",
  `${getProjectTypeLabelReplacement}\n\nfunction includesAny`
);

console.log("Updated getProjectTypeLabel.");

/**
 * 4. Replace isProjectType so database builds can use dynamic project types.
 */
const isProjectTypeReplacement = `function isProjectType(value: string): value is ProjectType {
  return typeof value === "string" && value.trim().length > 0;
}`;

updateBetween(
  "isProjectType",
  "function isProjectType(value: string): value is ProjectType {",
  "function isRecord",
  `${isProjectTypeReplacement}\n\nfunction isRecord`
);

console.log("Updated isProjectType.");

/**
 * 5. Replace runBuild so it calls /api/ai/generate-build.
 */
const newRunBuild = `  async function runBuild(
    promptValue: string,
    buildProjectType: ProjectType,
    buildModules: DetectedModule[],
    buildArchitecture: ArchitecturePlan,
    existingAssistantId?: string
  ) {
    const assistantMessage = createInitialAssistantUpdate(
      promptValue,
      buildProjectType,
      buildModules,
      buildArchitecture
    );

    const assistantId = existingAssistantId ?? assistantMessage.id;

    setIsBuilding(true);
    setWorkspaceError("");

    if (existingAssistantId) {
      setFeedItems((current) =>
        current.map((item) =>
          item.id === existingAssistantId
            ? {
                ...assistantMessage,
                id: assistantId,
              }
            : item
        )
      );
    } else {
      setFeedItems((current) => [
        ...current,
        {
          ...assistantMessage,
          id: assistantId,
        },
      ]);
    }

    scheduleScrollUpdate();

    await wait(450);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(item, 1)
          : item
      )
    );

    scheduleScrollUpdate();

    let generatedBuild: AiGeneratedBuild | null = null;

    try {
      const response = await fetch("/api/ai/generate-build", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptValue,
        }),
      });

      const result = await readApiResponse<{
        build: AiGeneratedBuild;
      }>(response);

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error ?? "Failed to generate AI build.");
      }

      generatedBuild = result.data.build;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI generation failed. Falling back to local planner.";

      setWorkspaceError(message);

      const fallbackFiles = createChangedFiles(
        promptValue,
        buildProjectType,
        buildModules,
        buildArchitecture
      );

      generatedBuild = {
        projectType: buildProjectType,
        classification: {
          primaryCategory: getProjectTypeLabel(buildProjectType),
          secondaryCategories: [],
          industry: null,
          platformTargets: ["web"],
          complexity: "standard",
        },
        modules: buildModules,
        architecture: buildArchitecture,
        files: fallbackFiles,
        previewState: createPreviewState(
          promptValue,
          buildProjectType,
          fallbackFiles.length,
          buildModules,
          buildArchitecture
        ),
        summary:
          "AI generation failed, so the local project planner created a fallback build.",
        changes: [
          "Generated fallback build from local planner.",
          "Kept project type inference, modules, architecture, files, and preview state available.",
        ],
      };
    }

    const generatedProjectType =
      generatedBuild.projectType || buildProjectType;

    const generatedModules =
      generatedBuild.modules.length > 0
        ? generatedBuild.modules
        : buildModules;

    const generatedArchitecture =
      generatedBuild.architecture ?? buildArchitecture;

    const generatedFiles =
      generatedBuild.files.length > 0
        ? generatedBuild.files
        : createChangedFiles(
            promptValue,
            generatedProjectType,
            generatedModules,
            generatedArchitecture
          );

    const generatedPreviewState: PreviewState = {
      ...generatedBuild.previewState,
      fileCount: generatedFiles.length,
      modules: generatedModules,
      architecture: generatedArchitecture,
    };

    const generatedChanges =
      generatedBuild.changes.length > 0
        ? generatedBuild.changes
        : buildChangeList(
            promptValue,
            generatedProjectType,
            generatedModules,
            generatedArchitecture
          );

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              2
            )
          : item
      )
    );

    scheduleScrollUpdate();

    await wait(500);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              3
            )
          : item
      )
    );

    scheduleScrollUpdate();

    await wait(500);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              4
            )
          : item
      )
    );

    setChangedFiles(generatedFiles);
    setSelectedFileId(generatedFiles[0]?.id ?? "");
    setPreviewState(generatedPreviewState);

    scheduleScrollUpdate();

    await wait(500);

    try {
      const savedHistoryItem = await saveBuildToDatabase(
        promptValue,
        generatedProjectType,
        generatedModules,
        generatedArchitecture,
        generatedFiles,
        generatedPreviewState
      );

      addBuildHistoryItem(savedHistoryItem);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save build.";

      setWorkspaceError(message);
    }

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary: generatedBuild.summary,
                changes: generatedChanges,
              },
              5
            )
          : item
      )
    );

    scheduleScrollUpdate();

    await wait(420);

    setFeedItems((current) =>
      current.map((item) =>
        item.id === assistantId && item.role === "assistant"
          ? advanceAssistantUpdate(
              {
                ...item,
                projectType: generatedProjectType,
                modules: generatedModules,
                architecture: generatedArchitecture,
                files: generatedFiles,
                summary:
                  generatedBuild.summary ||
                  \`\${getProjectTypeLabel(
                    generatedProjectType
                  )} implementation complete.\`,
                changes: generatedChanges,
              },
              6,
              true
            )
          : item
      )
    );

    setIsBuilding(false);
    scheduleScrollUpdate();
  }`;

updateBetween(
  "runBuild",
  "  async function runBuild(",
  "  async function handleSendPrompt()",
  `${newRunBuild}\n\n  async function handleSendPrompt()`
);

console.log("Updated runBuild to call /api/ai/generate-build.");

fs.writeFileSync(pagePath, source);

console.log("✅ app/page.tsx wired to AI generation.");
console.log(`Backup created at: ${backupPath}`);