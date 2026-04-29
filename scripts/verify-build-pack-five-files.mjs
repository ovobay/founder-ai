import fs from "node:fs";
import path from "node:path";

/**
 * This script verifies and repairs Build Pack tracking in app/page.tsx.
 *
 * Goal:
 * The Full build pack should track and export five core files:
 * - config/project-brief.md
 * - config/deploy-checklist.md
 * - config/env.example
 * - config/developer-instructions.md
 * - supabase/migrations/generated_architecture.sql
 *
 * The Handoff pack should remain three files:
 * - config/project-brief.md
 * - config/deploy-checklist.md
 * - config/env.example
 *
 * Why:
 * The Full build pack is intended for developer handoff and launch planning.
 * Developer instructions must be included so the generated project can explain
 * how to run, configure, migrate, deploy, and smoke-test itself.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-verify-five-file-build-pack-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Keep a backup because this app/page.tsx file has been through enough combat.
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
 * 1. Ensure getBuildPackFileStatuses tracks config/developer-instructions.md.
 */
updateBetween(
  "getBuildPackFileStatuses",
  "function getBuildPackFileStatuses(",
  "function getDeployReadinessItems(",
  (section) => {
    let updated = section;

    if (updated.includes('path: "config/developer-instructions.md"')) {
      console.log("Build Pack status already tracks developer instructions.");
      return updated;
    }

    const envBlock = `    {
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
    },`;

    const repairedBlock = `    {
      path: "config/env.example",
      label: "Environment example",
      purpose:
        "Template for local and production environment variables. Real secrets do not belong here, because we are not animals.",
    },
    {
      path: "config/developer-instructions.md",
      label: "Developer instructions",
      purpose:
        "Technical setup guide with local commands, required environment variables, Supabase migration steps, Vercel deployment steps, generated files, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",
      purpose:
        "Starter Supabase migration generated from planned database tables and Row Level Security scaffolding.",
    },`;

    if (!updated.includes(envBlock)) {
      console.log("Could not find exact env/sql block. Trying a looser insert before SQL migration.");

      updated = updated.replace(
        `    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`,
        `    {
      path: "config/developer-instructions.md",
      label: "Developer instructions",
      purpose:
        "Technical setup guide with local commands, required environment variables, Supabase migration steps, Vercel deployment steps, generated files, and smoke tests.",
    },
    {
      path: "supabase/migrations/generated_architecture.sql",
      label: "SQL migration",`
      );

      if (!updated.includes('path: "config/developer-instructions.md"')) {
        die("Could not insert developer instructions into getBuildPackFileStatuses.");
      }

      console.log("Inserted developer instructions before SQL migration using loose match.");
      return updated;
    }

    updated = updated.replace(envBlock, repairedBlock);
    console.log("Added developer instructions to getBuildPackFileStatuses.");

    return updated;
  }
);

/**
 * 2. Ensure handleExportFullBuildPack exports config/developer-instructions.md.
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("async function handleExportFullBuildPack()")) {
      die("handleExportFullBuildPack was not found. Add full build pack export first.");
    }

    if (updated.includes('filePath: "config/developer-instructions.md"')) {
      console.log("Full build pack already exports developer instructions.");
    } else {
      const envFileBlock = `      {
        filePath: "config/env.example",
        contents: createEnvExampleContents(variables),
      },
      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`;

      const repairedFileBlock = `      {
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
      },`;

      if (!updated.includes(envFileBlock)) {
        console.log("Could not find exact fullBuildFiles env/sql block. Trying loose SQL insertion.");

        updated = updated.replace(
          `      {
        filePath: "supabase/migrations/generated_architecture.sql",
        contents: createSqlMigrationContents(previewState.architecture),
      },`,
          `      {
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

        if (!updated.includes('filePath: "config/developer-instructions.md"')) {
          die("Could not insert developer instructions into fullBuildFiles.");
        }

        console.log("Inserted developer instructions into fullBuildFiles using loose match.");
      } else {
        updated = updated.replace(envFileBlock, repairedFileBlock);
        console.log("Added developer instructions to fullBuildFiles.");
      }
    }

    /**
     * Update text so the UI accurately describes the five-file Full build pack.
     */
    updated = updated.replaceAll(
      "Export brief, checklist, env example, and SQL migration.",
      "Export brief, checklist, env example, developer instructions, and SQL migration."
    );

    updated = updated.replaceAll(
      "Export brief, deployment checklist, environment example, and SQL migration.",
      "Export brief, deployment checklist, environment example, developer instructions, and SQL migration."
    );

    return updated;
  }
);

/**
 * 3. Ensure the Handoff pack still exports only the three lighter handoff files.
 *
 * This is intentional:
 * - Handoff pack: human/client-friendly docs
 * - Full build pack: handoff docs + developer instructions + SQL migration
 */
updateBetween(
  "handleExportHandoffPack",
  "async function handleExportHandoffPack()",
  "async function handleExportFullBuildPack()",
  (section) => {
    let updated = section;

    if (updated.includes('filePath: "config/developer-instructions.md"')) {
      updated = updated.replace(
        /,\s*\{\s*filePath: "config\/developer-instructions\.md",\s*contents: createDeveloperInstructions\(\{\s*previewState,\s*files,\s*\}\),\s*\}/g,
        ""
      );

      console.log("Removed developer instructions from handoff pack. Handoff pack stays lightweight.");
    } else {
      console.log("Handoff pack correctly does not include developer instructions.");
    }

    if (updated.includes('filePath: "supabase/migrations/generated_architecture.sql"')) {
      updated = updated.replace(
        /,\s*\{\s*filePath: "supabase\/migrations\/generated_architecture\.sql",\s*contents: createSqlMigrationContents\(previewState\.architecture\),\s*\}/g,
        ""
      );

      console.log("Removed SQL migration from handoff pack. SQL belongs in full build pack.");
    } else {
      console.log("Handoff pack correctly does not include SQL migration.");
    }

    return updated;
  }
);

/**
 * 4. Ensure Build Pack health summary mentions five tracked files naturally.
 *
 * The actual count comes from getBuildPackFileStatuses(files), so once the helper
 * tracks five files, the health score automatically uses five files.
 */
if (!source.includes("Developer instructions")) {
  console.log("Warning: Developer instructions text not found after repair. Check app/page.tsx manually.");
}

save();

console.log("");
console.log("✅ Build Pack five-file verification and repair complete.");
console.log(`Backup created at: ${backupPath}`);