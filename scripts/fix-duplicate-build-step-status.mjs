import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const brokenBlock = `type BuildStepStatus =

type BuildStepStatus = "pending" | "active" | "complete";`;

const fixedBlock = `type BuildStepStatus = "pending" | "active" | "complete";`;

if (source.includes(brokenBlock)) {
  source = source.replace(brokenBlock, fixedBlock);
} else {
  source = source.replace(
    /type BuildStepStatus =\s*\n\s*type BuildStepStatus = "pending" \| "active" \| "complete";/,
    fixedBlock
  );
}

fs.writeFileSync(pagePath, source);

console.log("✅ Fixed duplicate BuildStepStatus type in app/page.tsx");