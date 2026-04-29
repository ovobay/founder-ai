import fs from "node:fs";
import path from "node:path";

/**
 * This script removes competitor-specific naming from app/page.tsx.
 *
 * Goal:
 * Do not mention "Claude" or "Claude Design" in:
 * - UI labels
 * - exported file names
 * - generated markdown reports
 * - copy/export buttons
 * - summaries
 * - build pack tracking labels
 *
 * We keep the strategic concept but rename it to "Visual builder competitiveness",
 * which positions this product as its own platform instead of advertising a rival.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-remove-competitor-name-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Create a backup first. Because product positioning should not require archaeological recovery.
fs.writeFileSync(backupPath, source);

const replacements = [
  /**
   * Exported file path changes.
   */
  [
    "config/claude-design-competitiveness.md",
    "config/visual-builder-competitiveness.md",
  ],

  /**
   * User-facing panel/report labels.
   */
  ["Claude Design competitiveness", "Visual builder competitiveness"],
  ["Claude competitiveness", "Visual builder competitiveness"],
  ["Claude competitiveness review", "Visual builder competitiveness review"],
  ["Claude competitiveness summary", "Visual builder competitiveness summary"],
  ["Claude Design score", "Visual builder score"],
  ["Claude Design benchmark", "visual builder benchmark"],
  ["Claude Design competitiveness notes", "Visual builder competitiveness notes"],
  ["Claude Design competitiveness gaps", "Visual builder competitiveness gaps"],
  ["Claude-style visual polish", "polished visual-builder output"],

  /**
   * Button labels.
   */
  ["Export Claude competitiveness", "Export visual competitiveness"],
  ["Copy Claude summary", "Copy visual builder summary"],

  /**
   * Generated markdown headings and summaries.
   */
  [
    "Founder AI Claude Design competitiveness summary",
    "Founder AI visual builder competitiveness summary",
  ],
  [
    "# Claude Design competitiveness review",
    "# Visual builder competitiveness review",
  ],
  [
    "Competing with polished visual builders requires taste, structure, and fewer decorative lies.",
    "Competing with polished visual builders requires taste, structure, and fewer decorative lies.",
  ],

  /**
   * Finding labels/details.
   */
  [
    "Behind Claude Design benchmark:",
    "Behind visual builder benchmark:",
  ],
  [
    "No behind-benchmark Claude Design findings detected.",
    "No behind-benchmark visual builder findings detected.",
  ],
  [
    "Claude Design benchmark gap",
    "visual builder benchmark gap",
  ],
  [
    "Claude Design competitiveness is",
    "Visual builder competitiveness is",
  ],
  [
    "Claude Design competitiveness review",
    "Visual builder competitiveness review",
  ],

  /**
   * Product strategy wording.
   */
  [
    "before it can compete with Claude Design-level output",
    "before it can compete with polished visual-builder output",
  ],
  [
    "Claude Design-level output",
    "polished visual-builder output",
  ],
  [
    "to compete with Claude Design",
    "to compete with polished visual-builder tools",
  ],
  [
    "like Claude Design",
    "like polished visual-builder tools",
  ],
  [
    "Claude Design",
    "visual-builder tools",
  ],
  [
    "Claude",
    "visual builder",
  ],
];

let changeCount = 0;

for (const [from, to] of replacements) {
  if (source.includes(from)) {
    source = source.split(from).join(to);
    changeCount += 1;
    console.log(`Replaced: ${from} -> ${to}`);
  }
}

/**
 * Optional internal identifier cleanup.
 *
 * These are not user-facing, but renaming them keeps the code cleaner and avoids
 * future exported text accidentally leaking competitor-specific naming.
 */
const identifierReplacements = [
  ["ClaudeDesignCompetitiveStatus", "VisualBuilderCompetitiveStatus"],
  ["ClaudeDesignFinding", "VisualBuilderFinding"],
  ["ClaudeDesignCompetitivenessReport", "VisualBuilderCompetitivenessReport"],
  ["getClaudeDesignCompetitivenessReport", "getVisualBuilderCompetitivenessReport"],
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
  [
    "handleExportClaudeCompetitivenessReview",
    "handleExportVisualBuilderCompetitivenessReview",
  ],
  [
    "handleCopyClaudeCompetitivenessSummary",
    "handleCopyVisualBuilderCompetitivenessSummary",
  ],
  [
    "isExportingClaudeCompetitiveness",
    "isExportingVisualBuilderCompetitiveness",
  ],
  [
    "setIsExportingClaudeCompetitiveness",
    "setIsExportingVisualBuilderCompetitiveness",
  ],
  [
    "claudeCompetitivenessMessage",
    "visualBuilderCompetitivenessMessage",
  ],
  [
    "setClaudeCompetitivenessMessage",
    "setVisualBuilderCompetitivenessMessage",
  ],
  [
    "copyClaudeCompetitivenessMessage",
    "copyVisualBuilderCompetitivenessMessage",
  ],
  [
    "setCopyClaudeCompetitivenessMessage",
    "setCopyVisualBuilderCompetitivenessMessage",
  ],
  ["claudeReport", "visualBuilderReport"],
  ["behindClaudeFindings", "behindVisualBuilderFindings"],
  ["promisingClaudeFindings", "promisingVisualBuilderFindings"],
  ["claudeReviewBlock", "visualBuilderReviewBlock"],
];

for (const [from, to] of identifierReplacements) {
  if (source.includes(from)) {
    source = source.split(from).join(to);
    changeCount += 1;
    console.log(`Renamed identifier: ${from} -> ${to}`);
  }
}

/**
 * Repair any awkward wording produced by broad replacement.
 */
const cleanupReplacements = [
  ["visual-builder tools competitiveness", "visual builder competitiveness"],
  ["visual builder Design", "visual builder"],
  ["visual builder-style", "visual-builder-style"],
  ["visual builder-level", "visual-builder-level"],
  [
    "Copy visual builder summary",
    "Copy visual builder summary",
  ],
  [
    "Export visual competitiveness",
    "Export visual competitiveness",
  ],
  [
    "visual builder competitiveness review",
    "visual builder competitiveness review",
  ],
];

for (const [from, to] of cleanupReplacements) {
  if (source.includes(from)) {
    source = source.split(from).join(to);
    changeCount += 1;
    console.log(`Cleaned wording: ${from} -> ${to}`);
  }
}

/**
 * Final check: fail loudly if competitor naming remains in app/page.tsx.
 * This keeps the product from accidentally advertising a rival. Very noble.
 */
const forbiddenTerms = ["Claude", "claude"];
const leftovers = forbiddenTerms.filter((term) => source.includes(term));

fs.writeFileSync(pagePath, source);

console.log("");
console.log(`Replacement groups applied: ${changeCount}`);
console.log(`Backup created at: ${backupPath}`);

if (leftovers.length > 0) {
  console.log("");
  console.log("⚠️ Competitor naming still exists in app/page.tsx:");
  console.log(leftovers.join(", "));
  console.log("");
  console.log(
    "Run the grep command below to inspect the remaining references. Some may be inside old comments or unusual generated text."
  );
} else {
  console.log("✅ Competitor naming removed from app/page.tsx.");
}