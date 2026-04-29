import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-runtime-disabled-fix-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

let changes = 0;

function replaceAllRegex(label, regex, replacement) {
  const before = source;
  source = source.replace(regex, replacement);

  if (before !== source) {
    changes += 1;
    console.log(`✅ Fixed ${label}`);
  } else {
    console.log(`No match for ${label}`);
  }
}

/**
 * 1. Fix mutated workspace error setter names.
 * Example:
 * setWorkspaceError1("")
 * setWorkspaceError2(message)
 */
replaceAllRegex(
  "numbered setWorkspaceError variants",
  /\bsetWorkspaceError\d+\b/g,
  "setWorkspaceError"
);

/**
 * 2. Fix direct disabled null usage.
 */
replaceAllRegex(
  "disabled={null}",
  /disabled=\{null\}/g,
  "disabled={false}"
);

/**
 * 3. Fix ternary disabled props that return null.
 * Example:
 * disabled={isLoading ? true : null}
 * disabled={canSave ? false : null}
 */
replaceAllRegex(
  "disabled ternary true/null",
  /disabled=\{([^{}?:]+)\?\s*true\s*:\s*null\}/g,
  "disabled={Boolean($1)}"
);

replaceAllRegex(
  "disabled ternary false/null",
  /disabled=\{([^{}?:]+)\?\s*false\s*:\s*null\}/g,
  "disabled={!Boolean($1)}"
);

/**
 * 4. Fix undefined fallback too, since React hydration can still complain if SSR/client differ.
 */
replaceAllRegex(
  "disabled ternary true/undefined",
  /disabled=\{([^{}?:]+)\?\s*true\s*:\s*undefined\}/g,
  "disabled={Boolean($1)}"
);

replaceAllRegex(
  "disabled ternary false/undefined",
  /disabled=\{([^{}?:]+)\?\s*false\s*:\s*undefined\}/g,
  "disabled={!Boolean($1)}"
);

/**
 * 5. Fix common complex disabled pattern from previous scripts.
 */
replaceAllRegex(
  "disabled isBuilding/isLoading null pattern",
  /disabled=\{isBuilding\s*\|\|\s*isLoadingWorkspace\s*\?\s*true\s*:\s*null\}/g,
  "disabled={Boolean(isBuilding || isLoadingWorkspace)}"
);

replaceAllRegex(
  "disabled isBuilding/isLoading undefined pattern",
  /disabled=\{isBuilding\s*\|\|\s*isLoadingWorkspace\s*\?\s*true\s*:\s*undefined\}/g,
  "disabled={Boolean(isBuilding || isLoadingWorkspace)}"
);

/**
 * 6. Fix accidental prop destructuring aliases if any script invented them.
 */
replaceAllRegex(
  "setWorkspaceError numbered destructured props",
  /setWorkspaceError\d+:/g,
  "setWorkspaceError:"
);

/**
 * 7. Report anything suspicious still left.
 */
const remainingWorkspaceTypos = source.match(/\bsetWorkspaceError\d+\b/g) ?? [];
const remainingDisabledNulls = source.match(/disabled=\{null\}/g) ?? [];

fs.writeFileSync(pagePath, source);

console.log("");
console.log("Repair complete.");
console.log(`Backup created at: ${backupPath}`);

if (remainingWorkspaceTypos.length > 0) {
  console.log("");
  console.log("⚠️ Still found workspace setter typos:");
  console.log([...new Set(remainingWorkspaceTypos)].join(", "));
}

if (remainingDisabledNulls.length > 0) {
  console.log("");
  console.log("⚠️ Still found disabled={null} entries:");
  console.log(remainingDisabledNulls.length);
}

if (changes === 0) {
  console.log("");
  console.log("No changes were made. The issue may be in a different file or shaped differently.");
}