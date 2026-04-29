import fs from "node:fs";
import path from "node:path";

/**
 * Adds a small PublishDropdownChecklistRow helper component.
 *
 * This reduces repeated checklist row JSX inside:
 * - Security readiness panel
 * - Publish settings panel
 *
 * Scope:
 * - Adds helper component above PublishDropdownPopover
 * - Replaces repeated checklist .map() row markup
 *
 * Small cuts, clean code. No dramatic component extraction. We have suffered
 * enough TypeScript theatre for one dropdown.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-checklist-row-${Date.now()}.tsx`
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
if (!source.includes("function PublishDropdownChecklistRow({")) {
  const helper = `function PublishDropdownChecklistRow({
  label,
  done,
}: {
  label: string;
  done: boolean;
}) {
  // Compact checklist row used in publish security/settings panels.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        color: "#374151",
        fontSize: "12px",
        lineHeight: 1.35,
      }}
    >
      <span>{label}</span>
      <strong style={{ color: done ? "#166534" : "#9a3412" }}>
        {done ? "Ready" : "Missing"}
      </strong>
    </div>
  );
}

`;

  source =
    source.slice(0, dropdownStart) +
    helper +
    source.slice(dropdownStart);

  console.log("Added PublishDropdownChecklistRow component.");
} else {
  console.log("PublishDropdownChecklistRow already exists.");
}

/**
 * Recalculate section positions after optional insert.
 */
const newDropdownStart = source.indexOf(dropdownMarker);
const newToolbarStart = source.indexOf(toolbarMarker, newDropdownStart);

if (newDropdownStart === -1 || newToolbarStart === -1) {
  fail("Could not recalculate PublishDropdownPopover section.");
}

let section = source.slice(newDropdownStart, newToolbarStart);

/**
 * 2. Replace checklist row map blocks.
 *
 * This supports both the pre-helper inline style version and the version after
 * getPublishChecklistRowStyle() was introduced.
 */
const inlineChecklistMapBlock = `              {securityChecklist.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    color: "#374151",
                    fontSize: "12px",
                    lineHeight: 1.35,
                  }}
                >
                  <span>{item.label}</span>
                  <strong style={{ color: item.done ? "#166534" : "#9a3412" }}>
                    {item.done ? "Ready" : "Missing"}
                  </strong>
                </div>
              ))}`;

const helperStyleChecklistMapBlock = `              {securityChecklist.map((item) => (
                <div
                  key={item.label}
                  style={getPublishChecklistRowStyle()}
                >
                  <span>{item.label}</span>
                  <strong style={getPublishChecklistStatusStyle(item.done)}>
                    {item.done ? "Ready" : "Missing"}
                  </strong>
                </div>
              ))}`;

const securityReplacement = `              {securityChecklist.map((item) => (
                <PublishDropdownChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}`;

let replacedCount = 0;

if (section.includes(inlineChecklistMapBlock)) {
  section = section.replace(inlineChecklistMapBlock, securityReplacement);
  replacedCount += 1;
}

if (section.includes(helperStyleChecklistMapBlock)) {
  section = section.replace(helperStyleChecklistMapBlock, securityReplacement);
  replacedCount += 1;
}

const inlineSettingsMapBlock = `              {settingsChecklist.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    color: "#374151",
                    fontSize: "12px",
                    lineHeight: 1.35,
                  }}
                >
                  <span>{item.label}</span>
                  <strong style={{ color: item.done ? "#166534" : "#9a3412" }}>
                    {item.done ? "Ready" : "Missing"}
                  </strong>
                </div>
              ))}`;

const helperStyleSettingsMapBlock = `              {settingsChecklist.map((item) => (
                <div
                  key={item.label}
                  style={getPublishChecklistRowStyle()}
                >
                  <span>{item.label}</span>
                  <strong style={getPublishChecklistStatusStyle(item.done)}>
                    {item.done ? "Ready" : "Missing"}
                  </strong>
                </div>
              ))}`;

const settingsReplacement = `              {settingsChecklist.map((item) => (
                <PublishDropdownChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}`;

if (section.includes(inlineSettingsMapBlock)) {
  section = section.replace(inlineSettingsMapBlock, settingsReplacement);
  replacedCount += 1;
}

if (section.includes(helperStyleSettingsMapBlock)) {
  section = section.replace(helperStyleSettingsMapBlock, settingsReplacement);
  replacedCount += 1;
}

console.log(`Replaced checklist map blocks: ${replacedCount}`);

if (replacedCount === 0) {
  console.log(
    "No checklist blocks replaced. The structure may already be different. The helper was still added safely."
  );
}

/**
 * 3. Put patched section back.
 */
source =
  source.slice(0, newDropdownStart) +
  section +
  source.slice(newToolbarStart);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added PublishDropdownChecklistRow helper.");
console.log(`Backup created at: ${backupPath}`);