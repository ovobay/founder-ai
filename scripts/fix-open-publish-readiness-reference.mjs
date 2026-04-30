import fs from "node:fs";
import path from "node:path";

/**
 * Fixes broken PreviewToolbar reference:
 *
 *   onOpenReadiness={openPublishReadinessFromDropdown}
 *
 * The function no longer exists in the toolbar scope, so Next.js crashes.
 *
 * This replaces the dead function reference with a safe inline handler:
 *
 *   onOpenReadiness={() => {
 *     setIsPublishMenuOpen(false);
 *     onOpenPublishCenter();
 *   }}
 *
 * Because pointing JSX at an imaginary function is less "frontend engineering"
 * and more "summoning ritual with icons".
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

const backupPath = path.join(
  root,
  `app/page.backup-before-fix-open-publish-readiness-${Date.now()}.tsx`
);

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

const brokenReference = `onOpenReadiness={openPublishReadinessFromDropdown}`;

const fixedReference = `onOpenReadiness={() => {
              setIsPublishMenuOpen(false);
              onOpenPublishCenter();
            }}`;

let replacements = 0;

while (source.includes(brokenReference)) {
  source = source.replace(brokenReference, fixedReference);
  replacements += 1;
}

/**
 * Optional cleanup:
 * If a stale function exists elsewhere but is malformed, leave it alone.
 * If it exists correctly, it does no harm. The important part is removing the
 * undefined reference from JSX.
 */

fs.writeFileSync(pagePath, source);

console.log("");
console.log(`✅ Fixed openPublishReadinessFromDropdown references: ${replacements}`);
console.log(`Backup created at: ${backupPath}`);

if (replacements === 0) {
  console.log("");
  console.log("⚠️ No exact broken reference was found.");
  console.log("Run this to inspect remaining references:");
  console.log('grep -n "openPublishReadinessFromDropdown\\|onOpenReadiness" app/page.tsx');
}