import fs from "node:fs";
import path from "node:path";

/**
 * Adds micro-feedback to the main Publish dropdown action button.
 *
 * The main action button temporarily shows:
 * - Publishing...
 * - Published
 * - Updating...
 * - Updated
 * - Republishing...
 * - Republished
 *
 * Then it returns to the normal label.
 *
 * The goal is to make publish actions feel alive without making the UI behave
 * like a slot machine with venture funding.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-button-feedback-${Date.now()}.tsx`
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
 * 1. Add local button feedback state.
 */
if (!section.includes("const [publishActionFeedback, setPublishActionFeedback]")) {
  const marker = `  const [publishedFileCount, setPublishedFileCount] = useState(0);
`;

  if (!section.includes(marker)) {
    fail("Could not find publishedFileCount state marker.");
  }

  section = section.replace(
    marker,
    `${marker}  const [publishActionFeedback, setPublishActionFeedback] = useState("");
  const [isPublishingAction, setIsPublishingAction] = useState(false);
`
  );

  console.log("Added publish action feedback state.");
} else {
  console.log("Publish action feedback state already exists.");
}

/**
 * 2. Add helper function near the clipboard helpers.
 */
if (!section.includes("function runPublishActionFeedback")) {
  const marker = `  async function copyText(value: string, successMessage: string) {
`;

  if (!section.includes(marker)) {
    fail("Could not find copyText marker.");
  }

  const helper = `  function runPublishActionFeedback({
    loadingLabel,
    successLabel,
  }: {
    loadingLabel: string;
    successLabel: string;
  }) {
    // Briefly show action feedback on the main publish button.
    setIsPublishingAction(true);
    setPublishActionFeedback(loadingLabel);

    window.setTimeout(() => {
      setPublishActionFeedback(successLabel);

      window.setTimeout(() => {
        setIsPublishingAction(false);
        setPublishActionFeedback("");
      }, 700);
    }, 450);
  }

`;

  section = section.replace(marker, `${helper}${marker}`);
  console.log("Added runPublishActionFeedback helper.");
} else {
  console.log("runPublishActionFeedback helper already exists.");
}

/**
 * 3. Add feedback calls inside updateSnapshot().
 */
const noFilesBlock = `    if (!hasFiles || !gateReport) {
      setMessage("No generated files yet. Build something first.");
      return;
    }`;

const noFilesReplacement = `    if (!hasFiles || !gateReport) {
      runPublishActionFeedback({
        loadingLabel: "Checking...",
        successLabel: "Not ready",
      });
      setMessage("No generated files yet. Build something first.");
      return;
    }`;

if (section.includes(noFilesBlock)) {
  section = section.replace(noFilesBlock, noFilesReplacement);
  console.log("Added feedback for no-files state.");
} else {
  console.log("Skipped no-files feedback patch.");
}

const blockedBlock = `    if (gateReport.decision === "blocked") {
      setMessage("Snapshot updated. Publishing is still blocked.");
      return;
    }`;

const blockedReplacement = `    if (gateReport.decision === "blocked") {
      runPublishActionFeedback({
        loadingLabel: "Checking...",
        successLabel: "Blocked",
      });
      setMessage("Snapshot updated. Publishing is still blocked.");
      return;
    }`;

if (section.includes(blockedBlock)) {
  section = section.replace(blockedBlock, blockedReplacement);
  console.log("Added feedback for blocked state.");
} else {
  console.log("Skipped blocked feedback patch.");
}

const previewBlock = `    if (gateReport.decision === "can-preview") {
      setMessage("Preview snapshot updated. Review before staging.");
      return;
    }`;

const previewReplacement = `    if (gateReport.decision === "can-preview") {
      runPublishActionFeedback({
        loadingLabel: "Updating...",
        successLabel: "Preview updated",
      });
      setMessage("Preview snapshot updated. Review before staging.");
      return;
    }`;

if (section.includes(previewBlock)) {
  section = section.replace(previewBlock, previewReplacement);
  console.log("Added feedback for preview state.");
} else {
  console.log("Skipped preview feedback patch.");
}

const stageBlock = `    if (gateReport.decision === "can-stage") {
      setMessage("Staging snapshot updated. Run tests before production.");
      return;
    }`;

const stageReplacement = `    if (gateReport.decision === "can-stage") {
      runPublishActionFeedback({
        loadingLabel: "Updating...",
        successLabel: "Staging updated",
      });
      setMessage("Staging snapshot updated. Run tests before production.");
      return;
    }`;

if (section.includes(stageBlock)) {
  section = section.replace(stageBlock, stageReplacement);
  console.log("Added feedback for staging state.");
} else {
  console.log("Skipped staging feedback patch.");
}

const firstPublishBlock = `    if (!hasPublishedSnapshot) {
      setMessage("Published locally. Wire real deployment provider next.");
      return;
    }`;

const firstPublishReplacement = `    if (!hasPublishedSnapshot) {
      runPublishActionFeedback({
        loadingLabel: "Publishing...",
        successLabel: "Published",
      });
      setMessage("Published locally. Wire real deployment provider next.");
      return;
    }`;

if (section.includes(firstPublishBlock)) {
  section = section.replace(firstPublishBlock, firstPublishReplacement);
  console.log("Added feedback for first publish.");
} else {
  console.log("Skipped first publish feedback patch.");
}

const republishBlock = `    if (hasUnpublishedChanges) {
      setMessage("Republished locally with the latest generated files.");
      return;
    }`;

const republishReplacement = `    if (hasUnpublishedChanges) {
      runPublishActionFeedback({
        loadingLabel: "Republishing...",
        successLabel: "Republished",
      });
      setMessage("Republished locally with the latest generated files.");
      return;
    }`;

if (section.includes(republishBlock)) {
  section = section.replace(republishBlock, republishReplacement);
  console.log("Added feedback for republish.");
} else {
  console.log("Skipped republish feedback patch.");
}

const updateBlock = `    setMessage("Published snapshot updated.");`;

const updateReplacement = `    runPublishActionFeedback({
      loadingLabel: "Updating...",
      successLabel: "Updated",
    });

    setMessage("Published snapshot updated.");`;

if (section.includes(updateBlock)) {
  section = section.replace(updateBlock, updateReplacement);
  console.log("Added feedback for update.");
} else {
  console.log("Skipped update feedback patch.");
}

/**
 * 4. Reset feedback when publish state is reset.
 */
const resetMarker = `    setPublishedFileCount(0);
    setMessage("Publish settings reset.");`;

const resetReplacement = `    setPublishedFileCount(0);
    setPublishActionFeedback("");
    setIsPublishingAction(false);
    setMessage("Publish settings reset.");`;

if (section.includes(resetMarker)) {
  section = section.replace(resetMarker, resetReplacement);
  console.log("Added feedback reset to resetPublishState.");
} else {
  console.log("Skipped feedback reset patch.");
}

/**
 * 5. Replace main button label.
 */
const buttonLabel = `          {mainPublishActionLabel}
        </button>`;

const buttonLabelReplacement = `          {publishActionFeedback || mainPublishActionLabel}
        </button>`;

if (section.includes(buttonLabel)) {
  section = section.replace(buttonLabel, buttonLabelReplacement);
  console.log("Patched main publish button label.");
} else {
  console.log("Skipped button label patch. It may already be patched.");
}

/**
 * 6. Add disabled state and visual feedback to main button.
 */
const mainButtonStart = `        <button
          type="button"
          onClick={updateSnapshot}
          className="publish-button"
          style={{
            width: "100%",
            minHeight: "44px",
            borderRadius: "15px",
          }}
        >`;

const mainButtonReplacement = `        <button
          type="button"
          onClick={updateSnapshot}
          disabled={isPublishingAction}
          aria-busy={isPublishingAction}
          className="publish-button"
          style={{
            width: "100%",
            minHeight: "44px",
            borderRadius: "15px",
            opacity: isPublishingAction ? 0.86 : 1,
            cursor: isPublishingAction ? "wait" : "pointer",
          }}
        >`;

if (section.includes(mainButtonStart)) {
  section = section.replace(mainButtonStart, mainButtonReplacement);
  console.log("Added disabled/aria-busy state to main publish button.");
} else {
  console.log("Skipped main button visual state patch.");
}

/**
 * 7. Put section back.
 */
source = source.slice(0, start) + section + source.slice(end);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added publish button micro-feedback.");
console.log(`Backup created at: ${backupPath}`);