import fs from "node:fs";
import path from "node:path";

/**
 * Repairs broken identifiers created while removing competitor-specific naming.
 *
 * Problem examples:
 * - promisingvisual builderFindings
 * - behindvisual builderFindings
 * - competitivevisual builderFindings
 * - getvisual builderDesignCompetitivenessReport
 *
 * TypeScript identifiers cannot contain spaces, because apparently programming
 * languages still insist on rules. Very rude. Very necessary.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-broken-visual-builder-identifiers-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before repair so we can undo this if the file decides to become a sculpture.
fs.writeFileSync(backupPath, source);

const replacements = [
  /**
   * Broken variable names caused by replacing "claude" with "visual builder".
   */
  ["promisingvisual builderFindings", "promisingVisualBuilderFindings"],
  ["behindvisual builderFindings", "behindVisualBuilderFindings"],
  ["competitivevisual builderFindings", "competitiveVisualBuilderFindings"],
  ["visual builderCompetitiveness", "visualBuilderCompetitiveness"],
  ["visual builderReport", "visualBuilderReport"],
  ["visual builderFindings", "visualBuilderFindings"],

  /**
   * Broken function/type/component names.
   */
  [
    "getvisual builderDesignCompetitivenessReport",
    "getVisualBuilderCompetitivenessReport",
  ],
  [
    "getvisualBuilderDesignCompetitivenessReport",
    "getVisualBuilderCompetitivenessReport",
  ],
  [
    "visual builderDesignCompetitivenessReport",
    "VisualBuilderCompetitivenessReport",
  ],
  [
    "visualBuilderDesignCompetitivenessReport",
    "VisualBuilderCompetitivenessReport",
  ],
  [
    "visual builderDesignCompetitiveStatus",
    "VisualBuilderCompetitiveStatus",
  ],
  [
    "visualBuilderDesignCompetitiveStatus",
    "VisualBuilderCompetitiveStatus",
  ],
  ["visual builderDesignFinding", "VisualBuilderFinding"],
  ["visualBuilderDesignFinding", "VisualBuilderFinding"],
  [
    "visual builderDesignCompetitivenessPanel",
    "VisualBuilderCompetitivenessPanel",
  ],
  [
    "visualBuilderDesignCompetitivenessPanel",
    "VisualBuilderCompetitivenessPanel",
  ],
  ["visual builderDesignFindingCard", "VisualBuilderFindingCard"],
  ["visualBuilderDesignFindingCard", "VisualBuilderFindingCard"],
  [
    "createvisual builderDesignCompetitivenessMarkdown",
    "createVisualBuilderCompetitivenessMarkdown",
  ],
  [
    "createvisualBuilderDesignCompetitivenessMarkdown",
    "createVisualBuilderCompetitivenessMarkdown",
  ],
  [
    "createvisual builderDesignCompetitivenessSummary",
    "createVisualBuilderCompetitivenessSummary",
  ],
  [
    "createvisualBuilderDesignCompetitivenessSummary",
    "createVisualBuilderCompetitivenessSummary",
  ],

  /**
   * Remaining old-style identifiers if any are still present.
   */
  ["claudeCompetitiveness", "visualBuilderCompetitiveness"],
  ["claudeReport", "visualBuilderReport"],
  ["behindClaudeFindings", "behindVisualBuilderFindings"],
  ["promisingClaudeFindings", "promisingVisualBuilderFindings"],
  ["competitiveClaudeFindings", "competitiveVisualBuilderFindings"],
  ["ClaudeDesignCompetitiveStatus", "VisualBuilderCompetitiveStatus"],
  ["ClaudeDesignFinding", "VisualBuilderFinding"],
  ["ClaudeDesignCompetitivenessReport", "VisualBuilderCompetitivenessReport"],
  [
    "getClaudeDesignCompetitivenessReport",
    "getVisualBuilderCompetitivenessReport",
  ],
  ["ClaudeDesignCompetitivenessPanel", "VisualBuilderCompetitivenessPanel"],
  ["ClaudeDesignFindingCard", "VisualBuilderFindingCard"],
  [
    "createClaudeDesignCompetitivenessMarkdown",
    "createVisualBuilderCompetitivenessMarkdown",
  ],
  [
    "createClaudeDesignCompetitivenessSummary",
    "createVisualBuilderCompetitivenessSummary",
  ],

  /**
   * User-facing labels/files should stay competitor-neutral.
   */
  [
    "config/claude-design-competitiveness.md",
    "config/visual-builder-competitiveness.md",
  ],
  ["Claude Design competitiveness", "Visual builder competitiveness"],
  ["Claude competitiveness", "Visual builder competitiveness"],
  ["Claude Design benchmark", "visual builder benchmark"],
  ["Claude", "visual builder"],
  ["claude", "visualBuilder"],
];

let changeCount = 0;

for (const [from, to] of replacements) {
  if (source.includes(from)) {
    source = source.split(from).join(to);
    changeCount += 1;
    console.log(`Fixed: ${from} -> ${to}`);
  }
}

/**
 * Regex cleanup for any remaining malformed variable names that contain
 * "visual builder" in the middle of an identifier.
 */
source = source.replace(
  /\b(promising|behind|competitive)visual\s+builderFindings\b/g,
  (_match, prefix) => {
    changeCount += 1;
    const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    return `${prefix}VisualBuilderFindings`.replace(
      `${prefix}Visual`,
      `${prefix}Visual`
    );
  }
);

source = source.replace(/\bvisual\s+builderReport\b/g, () => {
  changeCount += 1;
  return "visualBuilderReport";
});

source = source.replace(/\bvisual\s+builderCompetitiveness\b/g, () => {
  changeCount += 1;
  return "visualBuilderCompetitiveness";
});

/**
 * Repair any awkward user-facing wording caused by broad replacements.
 */
const wordingRepairs = [
  ["visual builder Design", "visual builder"],
  ["Visual builder Design", "Visual builder"],
  ["visual-builder tools competitiveness", "visual builder competitiveness"],
  ["visualBuilder-competitiveness", "visual-builder-competitiveness"],
  ["getvisualBuilder", "getVisualBuilder"],
  ["createvisualBuilder", "createVisualBuilder"],
];

for (const [from, to] of wordingRepairs) {
  if (source.includes(from)) {
    source = source.split(from).join(to);
    changeCount += 1;
    console.log(`Cleaned: ${from} -> ${to}`);
  }
}

fs.writeFileSync(pagePath, source);

console.log("");
console.log(`Repair replacements applied: ${changeCount}`);
console.log(`Backup created at: ${backupPath}`);

const suspiciousPattern =
  /Claude|claude|visual builderFindings|promisingvisual|behindvisual|competitivevisual|getvisual builder|visual builderDesign|const\s+[A-Za-z]*visual\s+builder[A-Za-z]*/g;

const suspiciousMatches = source.match(suspiciousPattern) ?? [];

if (suspiciousMatches.length > 0) {
  console.log("");
  console.log("⚠️ Suspicious leftovers still found:");
  console.log([...new Set(suspiciousMatches)].join("\n"));
  console.log("");
  console.log("Run the grep command from the next step and paste the output.");
} else {
  console.log("✅ Broken visual-builder identifiers repaired.");
}