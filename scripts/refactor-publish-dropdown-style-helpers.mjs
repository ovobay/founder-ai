import fs from "node:fs";
import path from "node:path";

/**
 * Adds shared style helpers to PublishDropdownPopover and replaces the safest
 * repeated inline style blocks.
 *
 * This pass is intentionally conservative:
 * - keep the component in app/page.tsx
 * - avoid moving files
 * - avoid touching business logic
 * - reduce repeated style blocks without inviting the TypeScript goblin back
 *
 * Because yes, app/page.tsx is currently wearing a sofa as a coat.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-style-helper-refactor-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

const startMarker = "function PublishDropdownPopover({";
const endMarker = "function PreviewToolbar({";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1) {
  fail("Could not find function PublishDropdownPopover.");
}

if (end === -1) {
  fail("Could not find function PreviewToolbar after PublishDropdownPopover.");
}

let section = source.slice(start, end);

/**
 * 1. Add helper functions after secondaryButtonStyle.
 */
if (!section.includes("function getPublishBadgeStyle")) {
  const marker = `  const secondaryButtonStyle: React.CSSProperties = {
    minHeight: "38px",
    borderRadius: "13px",
    border: "1px solid #d7dbe3",
    background: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    fontWeight: 750,
    padding: "0 12px",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  };

`;

  if (!section.includes(marker)) {
    fail("Could not find secondaryButtonStyle marker.");
  }

  const helpers = `  function getPublishBadgeStyle(toneValue: {
    background: string;
    color: string;
    border: string;
  }): React.CSSProperties {
    // Shared badge style for domain, security, and settings status pills.
    return {
      borderRadius: "999px",
      border: \`1px solid \${toneValue.border}\`,
      background: toneValue.background,
      color: toneValue.color,
      fontSize: "11px",
      fontWeight: 850,
      padding: "6px 9px",
      whiteSpace: "nowrap",
    };
  }

  function getPublishCardStyle(): React.CSSProperties {
    // Shared compact card shell for grouped publish controls.
    return {
      border: "1px solid #eef1f4",
      borderRadius: "17px",
      padding: "12px",
      display: "grid",
      gap: "9px",
    };
  }

  function getPublishPanelStyle(): React.CSSProperties {
    // Shared inset panel shell for expanded dropdown panels.
    return {
      border: "1px solid #eef1f4",
      borderRadius: "16px",
      background: "#f9fafb",
      padding: "12px",
      display: "grid",
      gap: "10px",
    };
  }

  function getPublishChecklistStatusStyle(done: boolean): React.CSSProperties {
    // Shared status text for readiness checklist rows.
    return {
      color: done ? "#166534" : "#9a3412",
    };
  }

`;

  section = section.replace(marker, `${marker}${helpers}`);
  console.log("Added publish dropdown style helpers.");
} else {
  console.log("Publish dropdown style helpers already exist.");
}

/**
 * 2. Replace repeated compact card style blocks with getPublishCardStyle().
 */
const cardStyleBlock = `style={{
            border: "1px solid #eef1f4",
            borderRadius: "17px",
            padding: "12px",
            display: "grid",
            gap: "9px",
          }}`;

const cardStyleReplacement = `style={getPublishCardStyle()}`;

let cardReplaceCount = 0;
while (section.includes(cardStyleBlock)) {
  section = section.replace(cardStyleBlock, cardStyleReplacement);
  cardReplaceCount += 1;
}

console.log(`Replaced compact card style blocks: ${cardReplaceCount}`);

/**
 * 3. Replace repeated expanded panel style blocks with getPublishPanelStyle().
 */
const panelStyleBlock = `style={{
              border: "1px solid #eef1f4",
              borderRadius: "16px",
              background: "#f9fafb",
              padding: "12px",
              display: "grid",
              gap: "10px",
            }}`;

const panelStyleReplacement = `style={getPublishPanelStyle()}`;

let panelReplaceCount = 0;
while (section.includes(panelStyleBlock)) {
  section = section.replace(panelStyleBlock, panelStyleReplacement);
  panelReplaceCount += 1;
}

console.log(`Replaced expanded panel style blocks: ${panelReplaceCount}`);

/**
 * 4. Replace repeated badge style blocks for domain/security/settings tone pills.
 */
const domainBadgeBlock = `style={{
                borderRadius: "999px",
                border: \`1px solid \${domainTone.border}\`,
                background: domainTone.background,
                color: domainTone.color,
                fontSize: "11px",
                fontWeight: 850,
                padding: "6px 9px",
                whiteSpace: "nowrap",
              }}`;

const securityBadgeBlock = `style={{
                  borderRadius: "999px",
                  border: \`1px solid \${securityTone.border}\`,
                  background: securityTone.background,
                  color: securityTone.color,
                  fontSize: "11px",
                  fontWeight: 850,
                  padding: "6px 9px",
                  whiteSpace: "nowrap",
                }}`;

const settingsBadgeBlock = `style={{
                  borderRadius: "999px",
                  border: \`1px solid \${settingsTone.border}\`,
                  background: settingsTone.background,
                  color: settingsTone.color,
                  fontSize: "11px",
                  fontWeight: 850,
                  padding: "6px 9px",
                  whiteSpace: "nowrap",
                }}`;

let badgeReplaceCount = 0;

if (section.includes(domainBadgeBlock)) {
  section = section.replace(domainBadgeBlock, `style={getPublishBadgeStyle(domainTone)}`);
  badgeReplaceCount += 1;
}

if (section.includes(securityBadgeBlock)) {
  section = section.replace(securityBadgeBlock, `style={getPublishBadgeStyle(securityTone)}`);
  badgeReplaceCount += 1;
}

if (section.includes(settingsBadgeBlock)) {
  section = section.replace(settingsBadgeBlock, `style={getPublishBadgeStyle(settingsTone)}`);
  badgeReplaceCount += 1;
}

console.log(`Replaced badge style blocks: ${badgeReplaceCount}`);

/**
 * 5. Replace checklist status inline strong styles.
 */
const checklistStatusBlock = `style={{ color: item.done ? "#166534" : "#9a3412" }}`;
const checklistStatusReplacement = `style={getPublishChecklistStatusStyle(item.done)}`;

let checklistReplaceCount = 0;
while (section.includes(checklistStatusBlock)) {
  section = section.replace(checklistStatusBlock, checklistStatusReplacement);
  checklistReplaceCount += 1;
}

console.log(`Replaced checklist status style blocks: ${checklistReplaceCount}`);

/**
 * 6. Put patched section back.
 */
source = source.slice(0, start) + section + source.slice(end);
fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Publish dropdown style helper refactor complete.");
console.log(`Backup created at: ${backupPath}`);