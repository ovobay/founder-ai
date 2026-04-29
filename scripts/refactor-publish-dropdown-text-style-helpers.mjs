import fs from "node:fs";
import path from "node:path";

/**
 * Adds shared text style helpers to PublishDropdownPopover.
 *
 * This is a safe cleanup pass:
 * - no business logic changes
 * - no component extraction
 * - no file movement
 * - only repeated text style blocks are replaced
 *
 * The goal is to reduce inline-style sludge without turning app/page.tsx into
 * a courtroom exhibit.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-text-style-helper-refactor-${Date.now()}.tsx`
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
 * 1. Add text helper functions after existing style helpers.
 */
if (!section.includes("function getPublishTinyLabelStyle")) {
  const marker = `  function getPublishChecklistStatusStyle(done: boolean): React.CSSProperties {
    // Shared status text for readiness checklist rows.
    return {
      color: done ? "#166534" : "#9a3412",
    };
  }

`;

  if (!section.includes(marker)) {
    fail("Could not find getPublishChecklistStatusStyle marker. Run the previous style helper script first.");
  }

  const helpers = `  function getPublishTinyLabelStyle(): React.CSSProperties {
    // Shared tiny uppercase label style.
    return {
      color: "#6b7280",
      fontSize: "10px",
      fontWeight: 900,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      marginBottom: "5px",
    };
  }

  function getPublishSectionHeadingStyle(): React.CSSProperties {
    // Shared compact section heading style.
    return {
      color: "#111827",
      fontSize: "14px",
      fontWeight: 850,
    };
  }

  function getPublishMetaTextStyle(): React.CSSProperties {
    // Shared muted helper text style.
    return {
      color: "#4b5563",
      fontSize: "12px",
      lineHeight: 1.35,
    };
  }

  function getPublishChecklistRowStyle(): React.CSSProperties {
    // Shared checklist row layout style.
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      color: "#374151",
      fontSize: "12px",
      lineHeight: 1.35,
    };
  }

`;

  section = section.replace(marker, `${marker}${helpers}`);
  console.log("Added publish dropdown text style helpers.");
} else {
  console.log("Publish dropdown text style helpers already exist.");
}

/**
 * 2. Replace tiny uppercase label styles.
 */
const tinyLabelStyleBlock = `style={{
                  color: "#6b7280",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: "5px",
                }}`;

const tinyLabelStyleReplacement = `style={getPublishTinyLabelStyle()}`;

let tinyLabelReplaceCount = 0;
while (section.includes(tinyLabelStyleBlock)) {
  section = section.replace(tinyLabelStyleBlock, tinyLabelStyleReplacement);
  tinyLabelReplaceCount += 1;
}

console.log(`Replaced tiny label styles: ${tinyLabelReplaceCount}`);

/**
 * There is one header label variant with letterSpacing 0.18em and marginBottom 7px.
 * Keep that one for now because it is the top header label.
 */

/**
 * 3. Replace common section heading styles.
 */
const sectionHeadingStyleBlock = `style={{
                color: "#111827",
                fontSize: "14px",
                fontWeight: 850,
              }}`;

const sectionHeadingStyleReplacement = `style={getPublishSectionHeadingStyle()}`;

let sectionHeadingReplaceCount = 0;
while (section.includes(sectionHeadingStyleBlock)) {
  section = section.replace(sectionHeadingStyleBlock, sectionHeadingStyleReplacement);
  sectionHeadingReplaceCount += 1;
}

console.log(`Replaced section heading styles: ${sectionHeadingReplaceCount}`);

/**
 * 4. Replace muted metadata text styles.
 */
const metaTextStyleBlock = `style={{
                  color: "#4b5563",
                  fontSize: "12px",
                  lineHeight: 1.35,
                  marginTop: "4px",
                }}`;

const metaTextStyleReplacement = `style={{
                  ...getPublishMetaTextStyle(),
                  marginTop: "4px",
                }}`;

let metaReplaceCount = 0;
while (section.includes(metaTextStyleBlock)) {
  section = section.replace(metaTextStyleBlock, metaTextStyleReplacement);
  metaReplaceCount += 1;
}

console.log(`Replaced metadata text styles: ${metaReplaceCount}`);

/**
 * 5. Replace checklist row styles.
 */
const checklistRowStyleBlock = `style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    color: "#374151",
                    fontSize: "12px",
                    lineHeight: 1.35,
                  }}`;

const checklistRowStyleReplacement = `style={getPublishChecklistRowStyle()}`;

let checklistRowReplaceCount = 0;
while (section.includes(checklistRowStyleBlock)) {
  section = section.replace(checklistRowStyleBlock, checklistRowStyleReplacement);
  checklistRowReplaceCount += 1;
}

console.log(`Replaced checklist row styles: ${checklistRowReplaceCount}`);

/**
 * 6. Put patched section back.
 */
source = source.slice(0, start) + section + source.slice(end);
fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Publish dropdown text style helper refactor complete.");
console.log(`Backup created at: ${backupPath}`);