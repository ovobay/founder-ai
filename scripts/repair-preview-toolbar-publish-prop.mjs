import fs from "node:fs";
import path from "node:path";

/**
 * Repairs the Publish button wiring inside PreviewToolbar.
 *
 * Problem:
 * openPublishCenter exists in the main page component, but PreviewToolbar is a
 * child component. It cannot access openPublishCenter unless the function is
 * passed down as a prop.
 *
 * This script:
 * - Adds onOpenPublishCenter to the PreviewToolbar render call
 * - Adds onOpenPublishCenter to PreviewToolbar destructured props
 * - Adds onOpenPublishCenter to PreviewToolbar prop types
 * - Changes Publish/readiness buttons inside PreviewToolbar to call that prop
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-preview-toolbar-publish-prop-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Components do not share variables by vibes, unfortunately.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function fail(message) {
  save();
  throw new Error(message);
}

function updateBetween(label, startMarker, endMarker, updater) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    fail(`Could not find section: ${label}`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  source = before + updater(section) + after;
}

/**
 * 1. Add onOpenPublishCenter to the PreviewToolbar render call.
 */
if (!source.includes("onOpenPublishCenter={openPublishCenter}")) {
  const toolbarStart = source.indexOf("<PreviewToolbar");

  if (toolbarStart === -1) {
    fail("Could not find <PreviewToolbar render.");
  }

  const toolbarEnd = source.indexOf("/>", toolbarStart);

  if (toolbarEnd === -1) {
    fail("Could not find end of <PreviewToolbar render.");
  }

  const toolbarBlock = source.slice(toolbarStart, toolbarEnd + 2);

  const patchedToolbarBlock = toolbarBlock.replace(
    "/>",
    "  onOpenPublishCenter={openPublishCenter}\n            />"
  );

  source =
    source.slice(0, toolbarStart) +
    patchedToolbarBlock +
    source.slice(toolbarEnd + 2);

  console.log("Added onOpenPublishCenter to PreviewToolbar render.");
} else {
  console.log("PreviewToolbar render already receives onOpenPublishCenter.");
}

/**
 * 2. Patch the PreviewToolbar component definition.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function isAssistantBuildWorking(",
  (section) => {
    let updated = section;

    /**
     * Add to destructured props.
     */
    if (!updated.includes("onOpenPublishCenter,")) {
      const destructureEnd = updated.indexOf("}: {");

      if (destructureEnd === -1) {
        fail("Could not find PreviewToolbar destructured props end.");
      }

      updated =
        updated.slice(0, destructureEnd) +
        "  onOpenPublishCenter,\n" +
        updated.slice(destructureEnd);

      console.log("Added onOpenPublishCenter to PreviewToolbar destructured props.");
    } else {
      console.log("PreviewToolbar destructured props already include onOpenPublishCenter.");
    }

    /**
     * Add to prop types.
     */
    if (!updated.includes("onOpenPublishCenter: () => void;")) {
      const typeEnd = updated.indexOf("}) {");

      if (typeEnd === -1) {
        fail("Could not find PreviewToolbar prop type end.");
      }

      updated =
        updated.slice(0, typeEnd) +
        "  onOpenPublishCenter: () => void;\n" +
        updated.slice(typeEnd);

      console.log("Added onOpenPublishCenter to PreviewToolbar prop types.");
    } else {
      console.log("PreviewToolbar prop types already include onOpenPublishCenter.");
    }

    /**
     * Replace direct parent-only handler usage inside PreviewToolbar.
     */
    updated = updated.split("onClick={openPublishCenter}").join(
      "onClick={onOpenPublishCenter}"
    );

    /**
     * Replace any remaining direct setWorkspaceView publish handlers in this toolbar.
     */
    updated = updated.split('onClick={() => setWorkspaceView("publish-readiness")}').join(
      "onClick={onOpenPublishCenter}"
    );

    console.log("Updated PreviewToolbar publish buttons to use onOpenPublishCenter.");

    return updated;
  }
);

save();

console.log("");
console.log("✅ PreviewToolbar publish prop repair complete.");
console.log(`Backup created at: ${backupPath}`);