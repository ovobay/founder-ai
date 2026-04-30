import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "supabase/migrations/0001_founder_ai_core.sql",
  "supabase/migrations/0002_founder_ai_project_files.sql",
  "supabase/migrations/0003_founder_ai_build_classification.sql",
  "app/api/projects/current/route.ts",
  "app/api/projects/route.ts",
  "app/api/projects/[projectId]/files/route.ts",
  "app/api/projects/[projectId]/builds/route.ts",
  "app/api/files/[fileId]/route.ts",
  "app/api/builds/[buildId]/restore/route.ts",
  "app/api/ai/generate-build/route.ts",
];

const output = [];

for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);

  output.push("");
  output.push("=".repeat(100));
  output.push(relativePath);
  output.push("=".repeat(100));

  if (!fs.existsSync(absolutePath)) {
    output.push("MISSING");
    continue;
  }

  output.push(fs.readFileSync(absolutePath, "utf8"));
}

const outputPath = path.join(root, "tmp/project-isolation-audit.txt");
fs.writeFileSync(outputPath, output.join("\n"));

console.log(`Wrote ${outputPath}`);
console.log("");
console.log("Open it with:");
console.log("code tmp/project-isolation-audit.txt || open -a \"Visual Studio Code\" tmp/project-isolation-audit.txt");
