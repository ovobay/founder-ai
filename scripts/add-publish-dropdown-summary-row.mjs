import fs from "node:fs";
import path from "node:path";

/**
 * Adds a small PublishDropdownSummaryRow helper component.
 *
 * This reduces repeated detail-row markup inside PublishDropdownPopover.
 *
 * Scope:
 * - Adds PublishDropdownSummaryRow above PublishDropdownPopover
 * - Replaces the safest repeated Details rows only
 *
 * We are not moving files yet, because the app/page.tsx compiler has already
 * shown it has the temperament of a wet cat in a blazer.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-summary-row-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

const dropdownMarker = "function PublishDropdownPopover({";
const toolbarMarker = "function PreviewToolbar({";

const dropdownStart = source.indexOf(dropdownMarker);
const toolbarStart = source.indexOf(toolbarMarker, dropdownStart);

if (dropdownStart === -1) {
  fail("Could not find function PublishDropdownPopover.");
}

if (toolbarStart === -1) {
  fail("Could not find function PreviewToolbar after PublishDropdownPopover.");
}

/**
 * 1. Add helper component before PublishDropdownPopover.
 */
if (!source.includes("function PublishDropdownSummaryRow({")) {
  const helper = `function PublishDropdownSummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  // Compact label/value row used inside publish dropdown details.
  return (
    <div>
      <strong style={{ color: "#111827" }}>{label}:</strong> {value}
    </div>
  );
}

`;

  source =
    source.slice(0, dropdownStart) +
    helper +
    source.slice(dropdownStart);

  console.log("Added PublishDropdownSummaryRow component.");
} else {
  console.log("PublishDropdownSummaryRow already exists.");
}

/**
 * Recalculate because we may have inserted before the dropdown.
 */
const newDropdownStart = source.indexOf(dropdownMarker);
const newToolbarStart = source.indexOf(toolbarMarker, newDropdownStart);

if (newDropdownStart === -1 || newToolbarStart === -1) {
  fail("Could not recalculate PublishDropdownPopover section.");
}

let section = source.slice(newDropdownStart, newToolbarStart);

/**
 * 2. Replace stable detail rows.
 */
const replacements = [
  {
    from: `            <div>
              <strong style={{ color: "#111827" }}>Security files:</strong>{" "}
              {securityCount}/3
            </div>`,
    to: `            <PublishDropdownSummaryRow
              label="Security files"
              value={\`\${securityCount}/3\`}
            />`,
  },
  {
    from: `            <div>
              <strong style={{ color: "#111827" }}>Settings files:</strong>{" "}
              {settingsCount}/4
            </div>`,
    to: `            <PublishDropdownSummaryRow
              label="Settings files"
              value={\`\${settingsCount}/4\`}
            />`,
  },
  {
    from: `            <div>
              <strong style={{ color: "#111827" }}>Visibility:</strong>{" "}
              {visibility === "public" ? "Public" : "Private"}
            </div>`,
    to: `            <PublishDropdownSummaryRow
              label="Visibility"
              value={visibility === "public" ? "Public" : "Private"}
            />`,
  },
  {
    from: `            <div>
              <strong style={{ color: "#111827" }}>Domain:</strong> {domainTone.label}
            </div>`,
    to: `            <PublishDropdownSummaryRow
              label="Domain"
              value={domainTone.label}
            />`,
  },
  {
    from: `            <div>
              <strong style={{ color: "#111827" }}>Version:</strong>{" "}
              {hasPublishedSnapshot ? \`v\${publishVersion}\` : "Not published"}
            </div>`,
    to: `            <PublishDropdownSummaryRow
              label="Version"
              value={hasPublishedSnapshot ? \`v\${publishVersion}\` : "Not published"}
            />`,
  },
  {
    from: `            <div>
              <strong style={{ color: "#111827" }}>Unpublished changes:</strong>{" "}
              {hasUnpublishedChanges ? "Yes" : "No"}
            </div>`,
    to: `            <PublishDropdownSummaryRow
              label="Unpublished changes"
              value={hasUnpublishedChanges ? "Yes" : "No"}
            />`,
  },
];

let replacedCount = 0;

for (const item of replacements) {
  if (section.includes(item.from)) {
    section = section.replace(item.from, item.to);
    replacedCount += 1;
  }
}

console.log(`Replaced summary rows: ${replacedCount}`);

/**
 * 3. Put patched section back.
 */
source =
  source.slice(0, newDropdownStart) +
  section +
  source.slice(newToolbarStart);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added PublishDropdownSummaryRow helper.");
console.log(`Backup created at: ${backupPath}`);