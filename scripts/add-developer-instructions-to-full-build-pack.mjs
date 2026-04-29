import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx so Export full build pack also includes:
 * config/developer-instructions.md
 *
 * Before:
 * - config/project-brief.md
 * - config/deploy-checklist.md
 * - config/env.example
 * - supabase/migrations/generated_architecture.sql
 *
 * After:
 * - config/project-brief.md
 * - config/deploy-checklist.md
 * - config/env.example
 * - config/developer-instructions.md
 * - supabase/migrations/generated_architecture.sql
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-full-build-pack-dev-instructions-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are patching a very busy file, not diffusing a bomb with optimism.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
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
 * Patch DeployReadinessPanel because handleExportFullBuildPack lives there.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add config/developer-instructions.md to the fullBuildFiles array.
     */
    if (!updated.includes('filePath: "config/developer-instructions.md"')) {
      updated = updated.replace(
        `      {
        filePath: "config/env.example",
        contents: createEnvExampleContents(variables),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
        `      {
        filePath: "config/env.example",
        contents: createEnvExampleContents(variables),
      },
      {
        filePath: "config/developer-instructions.md",
        contents: createDeveloperInstructions({
          previewState,
          files,
        }),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`
      );

      console.log("Added developer instructions to full build pack.");
    } else {
      console.log("Developer instructions already included in full build pack.");
    }

    /**
     * Update the status helper text so the UI tells the truth. A novel concept.
     */
    updated = updated.replace(
      "Export brief, checklist, env example, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, and SQL migration."
    );

    return updated;
  }
);

/**
 * Update Build Pack contents panel so it tracks the developer instructions file too.
 */
if (!source.includes('path: "config/developer-instructions.md"')) {
  source = source.replace(
    `    {
      path: "config/env.example",
      label: "Environment example",
      purpose:
        "Template for local and production environment variables. Real secrets do not belong here, because we are not animals.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",
      purpose:
        "Starter Supabase migration generated from planned database tables and Row Level Security scaffolding.",
    },`,
    `    {
      path: "config/env.example",
      label: "Environment example",
      purpose:
        "Template for local and production environment variables. Real secrets do not belong here, because we are not animals.",
    },
    {
      path: "config/developer-instructions.md",
      label: "Developer instructions",
      purpose:
        "Technical setup guide with local commands, environment variables, Supabase migration steps, Vercel deployment steps, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",
      purpose:
        "Starter Supabase migration generated from planned database tables and Row Level Security scaffolding.",
    },`
  );

  console.log("Added developer instructions to Build Pack contents panel.");
} else {
  console.log("Developer instructions already tracked in Build Pack contents panel.");
}

save();

console.log("✅ Full build pack now includes developer instructions.");
console.log(`Backup created at: ${backupPath}`);