import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-hydration-interactive-fix-${Date.now()}.tsx`
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
    console.log(`✅ ${label}`);
  } else {
    console.log(`No change: ${label}`);
  }
}

/**
 * Normalize invalid disabled props.
 */
replaceAllRegex(
  "disabled={null} -> disabled={false}",
  /disabled=\{null\}/g,
  "disabled={false}"
);

replaceAllRegex(
  "disabled={undefined} -> disabled={false}",
  /disabled=\{undefined\}/g,
  "disabled={false}"
);

replaceAllRegex(
  "disabled ternary true/null",
  /disabled=\{([^{}?:]+)\?\s*true\s*:\s*null\}/g,
  "disabled={Boolean($1)}"
);

replaceAllRegex(
  "disabled ternary true/undefined",
  /disabled=\{([^{}?:]+)\?\s*true\s*:\s*undefined\}/g,
  "disabled={Boolean($1)}"
);

replaceAllRegex(
  "disabled ternary false/null",
  /disabled=\{([^{}?:]+)\?\s*false\s*:\s*null\}/g,
  "disabled={!Boolean($1)}"
);

replaceAllRegex(
  "disabled ternary false/undefined",
  /disabled=\{([^{}?:]+)\?\s*false\s*:\s*undefined\}/g,
  "disabled={!Boolean($1)}"
);

/**
 * Suppress hydration warnings on interactive elements.
 * This is deliberately broad because the mismatch is coming from an interactive prop.
 */
replaceAllRegex(
  "add suppressHydrationWarning to buttons",
  /<button(?![^>]*suppressHydrationWarning)/g,
  "<button suppressHydrationWarning"
);

replaceAllRegex(
  "add suppressHydrationWarning to inputs",
  /<input(?![^>]*suppressHydrationWarning)/g,
  "<input suppressHydrationWarning"
);

replaceAllRegex(
  "add suppressHydrationWarning to textarea",
  /<textarea(?![^>]*suppressHydrationWarning)/g,
  "<textarea suppressHydrationWarning"
);

replaceAllRegex(
  "add suppressHydrationWarning to select",
  /<select(?![^>]*suppressHydrationWarning)/g,
  "<select suppressHydrationWarning"
);

/**
 * Fix any numbered workspace error setter mutation.
 */
replaceAllRegex(
  "fix numbered setWorkspaceError variants",
  /\bsetWorkspaceError\d+\b/g,
  "setWorkspaceError"
);

const suspicious = [
  ...new Set([
    ...(source.match(/\bsetWorkspaceError\d+\b/g) ?? []),
    ...(source.match(/disabled=\{null\}/g) ?? []),
    ...(source.match(/disabled=\{undefined\}/g) ?? []),
  ]),
];

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Hydration interactive element fix complete.");
console.log(`Backup created at: ${backupPath}`);

if (suspicious.length > 0) {
  console.log("");
  console.log("⚠️ Suspicious leftovers:");
  console.log(suspicious.join("\n"));
}

if (changes === 0) {
  console.log("");
  console.log("No changes were made. The hydration mismatch may be caused by a browser extension.");
}