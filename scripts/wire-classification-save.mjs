import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

function save() {
  fs.writeFileSync(pagePath, source);
}

function replaceOnce(label, find, replacement) {
  if (!source.includes(find)) {
    throw new Error(`Missing block: ${label}`);
  }

  source = source.replace(find, replacement);
}

if (!source.includes("classification?: BuildClassification;")) {
  replaceOnce(
    "DatabaseBuild classification type",
    `  project_type: string;
  modules: unknown;`,
    `  project_type: string;
  classification?: unknown;
  modules: unknown;`
  );
}

if (!source.includes("classification?: BuildClassification;")) {
  replaceOnce(
    "BuildHistoryItem classification type",
    `  projectType: ProjectType;
  modules: DetectedModule[];`,
    `  projectType: ProjectType;
  classification?: BuildClassification;
  modules: DetectedModule[];`
  );
}

if (!source.includes("function parseClassification(")) {
  const insertAfter = `function parseProjectFiles(value: unknown): DatabaseProjectFile[] {`;

  const classificationParser = `function parseClassification(
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
        (item): item is string => typeof item === "string"
      )
    : [];

  const platformTargets = Array.isArray(value.platformTargets)
    ? value.platformTargets.filter(
        (item): item is string => typeof item === "string"
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
        ? value.primaryCategory
        : getProjectTypeLabel(projectType),
    secondaryCategories,
    industry:
      typeof value.industry === "string" && value.industry.trim().length > 0
        ? value.industry
        : null,
    platformTargets: platformTargets.length > 0 ? platformTargets : ["web"],
    complexity,
  };
}

`;

  source = source.replace(insertAfter, classificationParser + insertAfter);
}

if (!source.includes("const classification = parseClassification(")) {
  replaceOnce(
    "mapDatabaseBuildToHistoryItem classification",
    `  const modules = parseModules(build.modules);
  const architecture = parseArchitecture(build.architecture);`,
    `  const classification = parseClassification(
    build.classification,
    projectType
  );
  const modules = parseModules(build.modules);
  const architecture = parseArchitecture(build.architecture);`
  );
}

if (!source.includes("classification,")) {
  replaceOnce(
    "return classification in history item",
    `    projectType,
    modules,`,
    `    projectType,
    classification,
    modules,`
  );
}

if (!source.includes("classification?: BuildClassification")) {
  console.log("Classification type insertion may already be handled or not needed.");
}

if (!source.includes("classification: generatedBuild.classification")) {
  replaceOnce(
    "generated fallback classification already present check",
    `classification: {
          primaryCategory: getProjectTypeLabel(buildProjectType),
          secondaryCategories: [],
          industry: null,
          platformTargets: ["web"],
          complexity: "standard",
        },`,
    `classification: {
          primaryCategory: getProjectTypeLabel(buildProjectType),
          secondaryCategories: [],
          industry: null,
          platformTargets: ["web"],
          complexity: "standard",
        },`
  );
}

if (!source.includes("generatedClassification")) {
  replaceOnce(
    "generated classification constant",
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
}

if (!source.includes("classification: generatedClassification")) {
  replaceOnce(
    "assistant item generated classification",
    `                projectType: generatedProjectType,
                modules: generatedModules,`,
    `                projectType: generatedProjectType,
                classification: generatedClassification,
                modules: generatedModules,`
  );
}

if (!source.includes("classification,") || !source.includes("saveBuildToDatabase(")) {
  console.log("Skipping broad classification scan. Continuing.");
}

if (!source.includes("classification?: BuildClassification")) {
  console.log("Check app/page.tsx manually if TypeScript complains about classification.");
}

if (!source.includes("classification: generatedClassification")) {
  console.log("Could not confirm classification in assistant feed items. This is not fatal.");
}

if (!source.includes("classification: generatedClassification") && source.includes("generatedClassification")) {
  console.log("generatedClassification exists, assistant card classification not displayed yet.");
}

if (!source.includes("classification?: unknown")) {
  console.log("DatabaseBuild classification may already be declared differently.");
}

save();

console.log("✅ app/page.tsx classification patch completed.");