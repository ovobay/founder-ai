import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const fixes = [
  {
    name: "duplicate includesAny",
    regex:
      /function includesAny\s*\n\s*function includesAny\(value: string, keywords: string\[\]\) \{/g,
    replacement: "function includesAny(value: string, keywords: string[]) {",
  },
  {
    name: "duplicate isProjectType",
    regex:
      /function isProjectType\s*\n\s*function isProjectType\(value: string\): value is ProjectType \{/g,
    replacement: "function isProjectType(value: string): value is ProjectType {",
  },
  {
    name: "duplicate isRecord",
    regex:
      /function isRecord\s*\n\s*function isRecord\(value: unknown\): value is Record<string, unknown> \{/g,
    replacement:
      "function isRecord(value: unknown): value is Record<string, unknown> {",
  },
  {
    name: "duplicate handleSendPrompt",
    regex:
      /async function handleSendPrompt\s*\n\s*async function handleSendPrompt\(\) \{/g,
    replacement: "async function handleSendPrompt() {",
  },
];

for (const fix of fixes) {
  const before = source;
  source = source.replace(fix.regex, fix.replacement);

  if (before !== source) {
    console.log(`✅ Fixed ${fix.name}`);
  } else {
    console.log(`No issue found for ${fix.name}`);
  }
}

fs.writeFileSync(pagePath, source);

console.log("✅ Finished repairing duplicate function fragments in app/page.tsx");