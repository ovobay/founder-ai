import fs from "node:fs";
import path from "node:path";

/**
 * This script repairs the competitor-name cleanup.
 *
 * The previous cleanup removed user-facing competitor naming but also created
 * invalid identifiers such as:
 * getvisual builderDesignCompetitivenessReport
 *
 * This script:
 * - Repairs broken function/type/component names
 * - Renames remaining claudeCompetitiveness variables
 * - Renames ids such as "claude-competitiveness"
 * - Removes remaining "Claude"/"claude" references from app/page.tsx
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-visual-builder-rename-repair-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup before fixing the naming rubble. Civilisation advances.
fs.writeFileSync(backupPath, source);

const replacements = [
  /**
   * Repair broken identifiers created by broad text replacement.
   */
  [
    "getvisual builderDesignCompetitivenessReport",
    "getVisualBuilderCompetitivenessReport",
  ],
  [
    "visual builderDesignCompetitivenessReport",
    "VisualBuilderCompetitivenessReport",
  ],
  [
    "visual builderDesignCompetitiveStatus",
    "VisualBuilderCompetitiveStatus",
  ],
  [
    "visual builderDesignFinding",
    "VisualBuilderFinding",
  ],
  [
    "visual builderDesignCompetitivenessPanel",
    "VisualBuilderCompetitivenessPanel",
  ],
  [
    "visual builderDesignFindingCard",
    "VisualBuilderFindingCard",
  ],
  [
    "createvisual builderDesignCompetitivenessMarkdown",
    "createVisualBuilderCompetitivenessMarkdown",
  ],
  [
    "createvisual builderDesignCompetitivenessSummary",
    "createVisualBuilderCompetitivenessSummary",
  ],

  /**
   * Rename remaining variables and IDs.
   */
  ["claudeCompetitiveness", "visualBuilderCompetitiveness"],
  ["setClaudeCompetitiveness", "setVisualBuilderCompetitiveness"],
  ["copyClaudeCompetitiveness", "copyVisualBuilderCompetitiveness"],
  ["isExportingClaudeCompetitiveness", "isExportingVisualBuilderCompetitiveness"],
  ["setIsExportingClaudeCompetitiveness", "setIsExportingVisualBuilderCompetitiveness"],
  ["behindClaudeFindings", "behindVisualBuilderFindings"],
  ["promisingClaudeFindings", "promisingVisualBuilderFindings"],
  ["competitiveClaudeFindings", "competitiveVisualBuilderFindings"],
  ["claudeReviewBlock", "visualBuilderReviewBlock"],
  ['"claude-competitiveness"', '"visual-builder-competitiveness"'],

  /**
   * Remaining type/function/component names if any survived.
   */
  ["ClaudeDesignCompetitiveStatus", "VisualBuilderCompetitiveStatus"],
  ["ClaudeDesignFinding", "VisualBuilderFinding"],
  ["ClaudeDesignCompetitivenessReport", "VisualBuilderCompetitivenessReport"],
  ["getClaudeDesignCompetitivenessReport", "getVisualBuilderCompetitivenessReport"],
  ["ClaudeDesignCompetitivenessPanel", "VisualBuilderCompetitivenessPanel"],
  ["ClaudeDesignFindingCard", "VisualBuilderFindingCard"],
  ["createClaudeDesignCompetitivenessMarkdown", "createVisualBuilderCompetitivenessMarkdown"],
  ["createClaudeDesignCompetitivenessSummary", "createVisualBuilderCompetitivenessSummary"],
  ["handleExportClaudeCompetitivenessReview", "handleExportVisualBuilderCompetitivenessReview"],
  ["handleCopyClaudeCompetitivenessSummary", "handleCopyVisualBuilderCompetitivenessSummary"],

  /**
   * User-facing leftovers.
   */
  ["Claude Design", "visual builder"],
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
 * Repair awkward casing caused by the final broad lowercase replacement.
 */
const cleanupReplacements = [
  ["getvisualBuilderDesignCompetitivenessReport", "getVisualBuilderCompetitivenessReport"],
  ["visualBuilderDesignCompetitivenessReport", "VisualBuilderCompetitivenessReport"],
  ["visualBuilderDesignCompetitiveStatus", "VisualBuilderCompetitiveStatus"],
  ["visualBuilderDesignFinding", "VisualBuilderFinding"],
  ["visualBuilderDesignCompetitivenessPanel", "VisualBuilderCompetitivenessPanel"],
  ["visualBuilderDesignFindingCard", "VisualBuilderFindingCard"],
  ["createvisualBuilderDesignCompetitivenessMarkdown", "createVisualBuilderCompetitivenessMarkdown"],
  ["createvisualBuilderDesignCompetitivenessSummary", "createVisualBuilderCompetitivenessSummary"],
  ["Visual builder Design", "Visual builder"],
  ["visual builder Design", "visual builder"],
  ["visual-builder tools competitiveness", "visual builder competitiveness"],
  ["visualBuilder-competitiveness", "visual-builder-competitiveness"],
];

for (const [from, to] of cleanupReplacements) {
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

const forbiddenMatches = source.match(/Claude|claude/g) ?? [];
const brokenIdentifierMatches =
  source.match(/getvisual builder|visual builderDesign|claudeCompetitiveness|claude-competitiveness/g) ??
  [];

if (forbiddenMatches.length > 0 || brokenIdentifierMatches.length > 0) {
  console.log("");
  console.log("⚠️ Remaining suspicious terms found.");
  console.log("Run:");
  console.log(`grep -n "Claude\\|claude\\|getvisual builder\\|visual builderDesign\\|claudeCompetitiveness\\|claude-competitiveness" app/page.tsx`);
} else {
  console.log("✅ Competitor naming and broken identifiers repaired.");
}