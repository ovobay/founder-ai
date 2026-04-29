import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-classification-ui-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function replaceOnce(label, find, replacement) {
  if (!source.includes(find)) {
    die(`Missing block: ${label}`);
  }

  source = source.replace(find, replacement);
}

function insertBefore(label, marker, insertion) {
  if (source.includes(insertion.trim())) {
    console.log(`Skipping ${label}: already exists.`);
    return;
  }

  if (!source.includes(marker)) {
    die(`Missing marker: ${label}`);
  }

  source = source.replace(marker, `${insertion}${marker}`);
}

function updateBetween(label, startMarker, endMarker, updater) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    die(`Could not find section: ${label}`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  source = before + updater(section) + after;
}

/**
 * 1. Ensure BuildClassification type exists.
 */
const buildClassificationType = `type BuildClassification = {
  primaryCategory: string;
  secondaryCategories: string[];
  industry: string | null;
  platformTargets: string[];
  complexity: "simple" | "standard" | "advanced" | "enterprise";
};

`;

if (!source.includes("type BuildClassification = {")) {
  insertBefore(
    "BuildClassification type",
    "type BuildStepStatus =",
    buildClassificationType
  );
  console.log("Added BuildClassification type.");
} else {
  console.log("BuildClassification type already exists.");
}

/**
 * 2. Ensure PreviewState can carry classification.
 */
if (!source.includes("classification?: BuildClassification;")) {
  replaceOnce(
    "PreviewState classification field",
    `  projectType: string;
  fileCount: number;`,
    `  projectType: string;
  classification?: BuildClassification;
  fileCount: number;`
  );
  console.log("Added classification to PreviewState.");
} else {
  console.log("PreviewState classification field already exists.");
}

/**
 * 3. Ensure AiGeneratedBuild carries classification.
 */
if (source.includes("type AiGeneratedBuild = {")) {
  updateBetween(
    "AiGeneratedBuild",
    "type AiGeneratedBuild = {",
    "};",
    (section) => {
      if (section.includes("classification?: BuildClassification;")) {
        console.log("AiGeneratedBuild already has classification.");
        return section;
      }

      if (section.includes("projectType: ProjectType;")) {
        console.log("Added classification to AiGeneratedBuild.");
        return section.replace(
          "projectType: ProjectType;",
          "projectType: ProjectType;\n  classification?: BuildClassification;"
        );
      }

      return section;
    }
  );
}

/**
 * 4. Ensure DatabaseBuild carries classification from Supabase.
 */
if (source.includes("type DatabaseBuild = {")) {
  updateBetween(
    "DatabaseBuild",
    "type DatabaseBuild = {",
    "};",
    (section) => {
      if (section.includes("classification?: unknown;")) {
        console.log("DatabaseBuild already has classification.");
        return section;
      }

      if (section.includes("project_type: string;")) {
        console.log("Added classification to DatabaseBuild.");
        return section.replace(
          "project_type: string;",
          "project_type: string;\n  classification?: unknown;"
        );
      }

      return section;
    }
  );
}

/**
 * 5. Ensure BuildHistoryItem carries classification.
 */
if (source.includes("type BuildHistoryItem = {")) {
  updateBetween(
    "BuildHistoryItem",
    "type BuildHistoryItem = {",
    "};",
    (section) => {
      if (section.includes("classification?: BuildClassification;")) {
        console.log("BuildHistoryItem already has classification.");
        return section;
      }

      if (section.includes("projectType: ProjectType;")) {
        console.log("Added classification to BuildHistoryItem.");
        return section.replace(
          "projectType: ProjectType;",
          "projectType: ProjectType;\n  classification?: BuildClassification;"
        );
      }

      return section;
    }
  );
}

/**
 * 6. Add parseClassification helper if missing.
 */
const parseClassificationHelper = `function parseClassification(
  value: unknown,
  projectType: string
): BuildClassification {
  if (!isRecord(value)) {
    return {
      primaryCategory: getProjectTypeLabel(projectType),
      secondaryCategories: [],
      industry: null,
      platformTargets: ["web"],
      complexity: "standard",
    };
  }

  const secondaryCategories = Array.isArray(value.secondaryCategories)
    ? value.secondaryCategories.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];

  const platformTargets = Array.isArray(value.platformTargets)
    ? value.platformTargets.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];

  const complexity =
    value.complexity === "simple" ||
    value.complexity === "standard" ||
    value.complexity === "advanced" ||
    value.complexity === "enterprise"
      ? value.complexity
      : "standard";

  return {
    primaryCategory:
      typeof value.primaryCategory === "string" &&
      value.primaryCategory.trim().length > 0
        ? value.primaryCategory.trim()
        : getProjectTypeLabel(projectType),
    secondaryCategories,
    industry:
      typeof value.industry === "string" && value.industry.trim().length > 0
        ? value.industry.trim()
        : null,
    platformTargets: platformTargets.length > 0 ? platformTargets : ["web"],
    complexity,
  };
}

`;

if (!source.includes("function parseClassification(")) {
  insertBefore(
    "parseClassification helper",
    "function parseModules(value: unknown): DetectedModule[]",
    parseClassificationHelper
  );
  console.log("Added parseClassification helper.");
} else {
  console.log("parseClassification helper already exists.");
}

/**
 * 7. Patch mapDatabaseBuildToHistoryItem to parse classification.
 */
updateBetween(
  "mapDatabaseBuildToHistoryItem",
  "function mapDatabaseBuildToHistoryItem(build: DatabaseBuild): BuildHistoryItem {",
  "async function readApiResponse",
  (section) => {
    let updated = section;

    if (!updated.includes("const classification = parseClassification(")) {
      updated = updated.replace(
        `  const modules = parseModules(build.modules);`,
        `  const classification = parseClassification(
    build.classification,
    projectType
  );
  const modules = parseModules(build.modules);`
      );
      console.log("Added classification parsing to mapDatabaseBuildToHistoryItem.");
    } else {
      console.log("mapDatabaseBuildToHistoryItem already parses classification.");
    }

    if (!updated.includes("classification,")) {
      updated = updated.replace(
        `    projectType,
    modules,`,
        `    projectType,
    classification,
    modules,`
      );
      console.log("Added classification to BuildHistoryItem return.");
    }

    if (!updated.includes("classification: classification")) {
      updated = updated.replace(
        `  const previewState =
    parsedPreviewState ??
    createPreviewState(
      build.prompt,
      projectType,
      files.length,
      modules,
      architecture
    );`,
        `  const previewState =
    parsedPreviewState
      ? {
          ...parsedPreviewState,
          classification,
        }
      : {
          ...createPreviewState(
            build.prompt,
            projectType,
            files.length,
            modules,
            architecture
          ),
          classification,
        };`
      );
      console.log("Added classification to mapped previewState.");
    }

    return updated;
  }
);

/**
 * 8. Ensure createPreviewState fallback includes classification.
 */
updateBetween(
  "createPreviewState",
  "function createPreviewState(",
  "function createBuildSteps(",
  (section) => {
    let updated = section;

    if (updated.includes("classification: {")) {
      console.log("createPreviewState already includes classification.");
      return updated;
    }

    updated = updated.replaceAll(
      `modules,
      architecture,`,
      `classification: {
        primaryCategory: getProjectTypeLabel(projectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      },
      modules,
      architecture,`
    );

    console.log("Added fallback classification to createPreviewState returns.");
    return updated;
  }
);

/**
 * 9. Ensure saveBuildToDatabase accepts and sends classification.
 */
updateBetween(
  "saveBuildToDatabase",
  "  async function saveBuildToDatabase(",
  "  function addBuildHistoryItem(",
  (section) => {
    let updated = section;

    if (!updated.includes("classification: BuildClassification,")) {
      updated = updated.replace(
        `    projectType: ProjectType,
    modules: DetectedModule[],`,
        `    projectType: ProjectType,
    classification: BuildClassification,
    modules: DetectedModule[],`
      );
      console.log("Added classification parameter to saveBuildToDatabase.");
    } else {
      console.log("saveBuildToDatabase already has classification parameter.");
    }

    if (!updated.includes("classification,")) {
      updated = updated.replace(
        `        projectType,
        modules,`,
        `        projectType,
        classification,
        modules,`
      );
      console.log("Added classification to saveBuildToDatabase JSON body.");
    } else {
      console.log("saveBuildToDatabase JSON body already includes classification.");
    }

    return updated;
  }
);

/**
 * 10. Ensure runBuild creates generatedClassification and passes it to save.
 */
updateBetween(
  "runBuild",
  "  async function runBuild(",
  "  async function handleSendPrompt()",
  (section) => {
    let updated = section;

    if (!updated.includes("const generatedClassification =")) {
      updated = updated.replace(
        `    const generatedProjectType =
      generatedBuild.projectType || buildProjectType;`,
        `    const generatedProjectType =
      generatedBuild.projectType || buildProjectType;

    const generatedClassification =
      generatedBuild.classification ?? {
        primaryCategory: getProjectTypeLabel(generatedProjectType),
        secondaryCategories: [],
        industry: null,
        platformTargets: ["web"],
        complexity: "standard",
      };`
      );
      console.log("Added generatedClassification in runBuild.");
    } else {
      console.log("runBuild already has generatedClassification.");
    }

    if (!updated.includes("classification: generatedClassification,")) {
      updated = updated.replaceAll(
        `projectType: generatedProjectType,
                modules: generatedModules,`,
        `projectType: generatedProjectType,
                classification: generatedClassification,
                modules: generatedModules,`
      );
      console.log("Added classification to assistant feed updates.");
    } else {
      console.log("Assistant feed updates already include classification.");
    }

    if (!updated.includes("generatedClassification,\n        generatedModules")) {
      updated = updated.replace(
        `        generatedProjectType,
        generatedModules,`,
        `        generatedProjectType,
        generatedClassification,
        generatedModules,`
      );
      console.log("Passed classification into saveBuildToDatabase.");
    } else {
      console.log("saveBuildToDatabase call already receives classification.");
    }

    if (!updated.includes("classification: generatedClassification,\n      fileCount")) {
      updated = updated.replace(
        `      ...generatedBuild.previewState,
      fileCount: generatedFiles.length,`,
        `      ...generatedBuild.previewState,
      classification: generatedClassification,
      fileCount: generatedFiles.length,`
      );
      console.log("Added classification to generatedPreviewState.");
    } else {
      console.log("generatedPreviewState already has classification.");
    }

    return updated;
  }
);

/**
 * 11. Add UI cards in ArchitectureWorkspace.
 */
const classificationSummaryFunction = `function ClassificationWorkspaceSummary({
  classification,
}: {
  classification?: BuildClassification;
}) {
  if (!classification) {
    return null;
  }

  const secondary =
    classification.secondaryCategories.length > 0
      ? classification.secondaryCategories.join(", ")
      : "None";

  const targets =
    classification.platformTargets.length > 0
      ? classification.platformTargets.join(", ")
      : "web";

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px",
          color: "#111827",
          fontSize: "16px",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        AI classification
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <ClassificationTile
          label="Primary category"
          value={classification.primaryCategory}
        />
        <ClassificationTile
          label="Industry"
          value={classification.industry ?? "General"}
        />
        <ClassificationTile
          label="Platform targets"
          value={targets}
        />
        <ClassificationTile
          label="Complexity"
          value={classification.complexity}
        />
      </div>

      <div
        style={{
          marginTop: "10px",
        }}
      >
        <ClassificationTile
          label="Secondary categories"
          value={secondary}
        />
      </div>
    </section>
  );
}

function ClassificationTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "11px",
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display: "block",
          color: "#111827",
          fontSize: "13px",
          lineHeight: 1.45,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

`;

if (!source.includes("function ClassificationWorkspaceSummary(")) {
  insertBefore(
    "ClassificationWorkspaceSummary",
    "function ArchitectureSection({",
    classificationSummaryFunction
  );
  console.log("Added classification UI components.");
} else {
  console.log("Classification UI components already exist.");
}

updateBetween(
  "ArchitectureWorkspace render",
  "function ArchitectureWorkspace({",
  "function HistoryWorkspace(",
  (section) => {
    if (section.includes("<ClassificationWorkspaceSummary")) {
      console.log("ArchitectureWorkspace already renders classification summary.");
      return section;
    }

    const marker = `        <ArchitectureSection
          title="Detected modules"`;

    if (!section.includes(marker)) {
      console.log("Could not find ArchitectureSection marker. Skipping visual insertion.");
      return section;
    }

    console.log("Added classification summary to ArchitectureWorkspace.");
    return section.replace(
      marker,
      `        <ClassificationWorkspaceSummary
          classification={previewState.classification}
        />

${marker}`
    );
  }
);

save();

console.log("✅ Classification UI wiring complete.");
console.log(`Backup created at: ${backupPath}`);