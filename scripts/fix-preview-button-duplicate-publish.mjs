import fs from "node:fs";
import path from "node:path";

/**
 * Repairs the toolbar when the Preview button has accidentally become Publish.
 *
 * Fixes:
 * - First toolbar button wrongly says "Publish"
 * - First toolbar button wrongly opens publish dropdown/readiness
 * - Duplicate publish buttons inside the left toolbar area
 *
 * Keeps:
 * - The real right-side Publish button/dropdown
 *
 * Because apparently one Publish button was not enough for the toolbar goblin.
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

const backupPath = path.join(
  root,
  `app/page.backup-before-fix-preview-duplicate-publish-${Date.now()}.tsx`
);

fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

function findMatchingTagEnd(text, openStart, tagName) {
  const openToken = `<${tagName}`;
  const closeToken = `</${tagName}>`;

  let index = openStart;
  let depth = 0;

  while (index < text.length) {
    const nextOpen = text.indexOf(openToken, index);
    const nextClose = text.indexOf(closeToken, index);

    if (nextClose === -1) {
      return -1;
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + openToken.length;
      continue;
    }

    depth -= 1;
    index = nextClose + closeToken.length;

    if (depth === 0) {
      return index;
    }
  }

  return -1;
}

function findMatchingDivEnd(text, divStart) {
  return findMatchingTagEnd(text, divStart, "div");
}

function findMatchingHeaderEnd(text, headerStart) {
  return findMatchingTagEnd(text, headerStart, "header");
}

function findMatchingButtonEnd(text, buttonStart) {
  return findMatchingTagEnd(text, buttonStart, "button");
}

const toolbarClassIndex = source.indexOf("preview-toolbar");

if (toolbarClassIndex === -1) {
  fail('Could not find "preview-toolbar" in app/page.tsx.');
}

const headerStart = source.lastIndexOf("<header", toolbarClassIndex);

if (headerStart === -1) {
  fail("Could not find opening <header> for preview toolbar.");
}

const headerEnd = findMatchingHeaderEnd(source, headerStart);

if (headerEnd === -1) {
  fail("Could not find closing </header> for preview toolbar.");
}

let toolbar = source.slice(headerStart, headerEnd);

/**
 * 1. Force the first button inside the toolbar to become the real Preview button.
 */
const firstButtonStart = toolbar.indexOf("<button");

if (firstButtonStart === -1) {
  fail("Could not find first button inside preview toolbar.");
}

const firstButtonEnd = findMatchingButtonEnd(toolbar, firstButtonStart);

if (firstButtonEnd === -1) {
  fail("Could not find end of first toolbar button.");
}

const repairedPreviewButton = `<button
          suppressHydrationWarning
          type="button"
          className="preview-button"
          onClick={() => setWorkspaceView("preview")}
          aria-pressed={workspaceView === "preview"}
        >
          <Globe2 className="icon" />
          Preview
        </button>`;

toolbar =
  toolbar.slice(0, firstButtonStart) +
  repairedPreviewButton +
  toolbar.slice(firstButtonEnd);

console.log("Forced first toolbar button back to Preview.");

/**
 * 2. Remove accidental duplicate Publish buttons from the LEFT toolbar area only.
 *
 * We preserve the real Publish dropdown on the right, which is normally inside:
 * - repaired-preview-toolbar-right
 * - toolbar-dropdown-anchor
 *
 * The left region ends before repaired-preview-toolbar-right if present.
 */
const rightAreaIndex = toolbar.indexOf("repaired-preview-toolbar-right");
const scanEnd = rightAreaIndex === -1 ? toolbar.length : rightAreaIndex;

let leftArea = toolbar.slice(0, scanEnd);
const rightArea = toolbar.slice(scanEnd);

let removedDuplicatePublishButtons = 0;

function buttonLooksLikeLeftDuplicatePublish(buttonText) {
  const hasPublishText = />\s*Publish\s*<\/button>/.test(buttonText);
  const opensPublish =
    buttonText.includes("setIsPublishMenuOpen") ||
    buttonText.includes("openPublish") ||
    buttonText.includes("onOpenPublishCenter") ||
    buttonText.includes('workspaceView === "publish-readiness"');

  const isRightDropdownPublish =
    buttonText.includes('aria-label="Open publish menu"') ||
    buttonText.includes("toolbar-publish") ||
    buttonText.includes("PublishToolbarDropdown");

  return hasPublishText && opensPublish && !isRightDropdownPublish;
}

let searchIndex = 0;

while (searchIndex < leftArea.length) {
  const buttonStart = leftArea.indexOf("<button", searchIndex);

  if (buttonStart === -1) break;

  const buttonEnd = findMatchingButtonEnd(leftArea, buttonStart);

  if (buttonEnd === -1) break;

  const buttonText = leftArea.slice(buttonStart, buttonEnd);

  if (buttonLooksLikeLeftDuplicatePublish(buttonText)) {
    leftArea = leftArea.slice(0, buttonStart) + leftArea.slice(buttonEnd);
    removedDuplicatePublishButtons += 1;
    searchIndex = buttonStart;
    continue;
  }

  searchIndex = buttonEnd;
}

toolbar = leftArea + rightArea;

console.log(`Removed duplicate left-side Publish buttons: ${removedDuplicatePublishButtons}`);

/**
 * 3. Guardrail: ensure the first button now contains Preview.
 */
const verifyFirstButtonStart = toolbar.indexOf("<button");
const verifyFirstButtonEnd = findMatchingButtonEnd(toolbar, verifyFirstButtonStart);
const verifyFirstButton = toolbar.slice(verifyFirstButtonStart, verifyFirstButtonEnd);

if (!verifyFirstButton.includes("Preview")) {
  fail("Repair failed: first toolbar button still does not contain Preview.");
}

if (!verifyFirstButton.includes('setWorkspaceView("preview")')) {
  fail("Repair failed: first toolbar button does not switch to preview.");
}

/**
 * 4. Replace toolbar back into page.
 */
source = source.slice(0, headerStart) + toolbar + source.slice(headerEnd);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Preview button / duplicate Publish repair complete.");
console.log(`Backup created at: ${backupPath}`);
console.log("");
console.log("Check remaining toolbar Publish labels with:");
console.log('grep -n -A 8 -B 8 ">Publish<\\|Publish</button>\\|Open publish menu" app/page.tsx');