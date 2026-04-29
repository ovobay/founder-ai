import fs from "node:fs";
import path from "node:path";

/**
 * Fixes the Publish button flow in a simpler, more reliable way.
 *
 * Problem:
 * Passing openPublishCenter into PreviewToolbar can fail if the prop wiring is
 * even slightly off. Rather than continuing the prop circus, this script makes:
 *
 * - Toolbar Publish buttons directly call setWorkspaceView("publish-readiness")
 * - Parent component automatically scroll to Publish Center whenever
 *   workspaceView becomes "publish-readiness"
 *
 * Result:
 * Any button that opens Publish readiness also lands the user at Publish Center.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-fix-publish-button-simple-scroll-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are removing unnecessary prop drama, not summoning more.
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
 * 1. Ensure publishCenterRef exists in the main component.
 */
if (!source.includes("const publishCenterRef = useRef<HTMLDivElement | null>(null);")) {
  const refMarker = `  const activityScrollRef = useRef<HTMLDivElement | null>(null);
`;

  if (!source.includes(refMarker)) {
    fail("Could not find activityScrollRef to place publishCenterRef beside it.");
  }

  source = source.replace(
    refMarker,
    `${refMarker}  const publishCenterRef = useRef<HTMLDivElement | null>(null);
`
  );

  console.log("Added publishCenterRef.");
} else {
  console.log("publishCenterRef already exists.");
}

/**
 * 2. Add an automatic scroll effect whenever Publish readiness opens.
 *
 * This means any button can simply setWorkspaceView("publish-readiness"),
 * and the parent handles the scroll. Cleaner. Less prop nonsense.
 */
if (!source.includes("Auto-scroll to Publish Center when Publish readiness opens")) {
  const effectCode = `
  useEffect(() => {
    // Auto-scroll to Publish Center when Publish readiness opens.
    if (workspaceView !== "publish-readiness") return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        publishCenterRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }, [workspaceView]);

`;

  const insertMarker = `  function scrollToBottom() {
`;

  if (!source.includes(insertMarker)) {
    fail("Could not find scrollToBottom marker to insert publish-center scroll effect.");
  }

  source = source.replace(insertMarker, `${effectCode}${insertMarker}`);
  console.log("Added publish readiness auto-scroll effect.");
} else {
  console.log("Publish readiness auto-scroll effect already exists.");
}

/**
 * 3. Keep openPublishCenter if it exists, but make it only switch view.
 *
 * The useEffect now handles scrolling, so the handler becomes simple and safe.
 */
if (source.includes("function openPublishCenter()")) {
  updateBetween(
    "openPublishCenter",
    "  function openPublishCenter() {",
    "  async function signOut()",
    (section) => {
      if (!section.includes("setWorkspaceView")) return section;

      const replacement = `  function openPublishCenter() {
    // Open Publish readiness. The scroll effect focuses the Publish Center.
    setWorkspaceView("publish-readiness");
  }

`;

      console.log("Simplified openPublishCenter.");
      return replacement;
    }
  );
}

/**
 * 4. Patch PreviewToolbar so publish controls use setWorkspaceView directly.
 *
 * PreviewToolbar already has setWorkspaceView because the other toolbar buttons use it.
 * This avoids relying on onOpenPublishCenter being passed correctly.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function isAssistantBuildWorking(",
  (section) => {
    let updated = section;

    updated = updated
      .split("onClick={openPublishCenter}")
      .join('onClick={() => setWorkspaceView("publish-readiness")}');

    updated = updated
      .split("onClick={onOpenPublishCenter}")
      .join('onClick={() => setWorkspaceView("publish-readiness")}');

    console.log("Rewired PreviewToolbar publish buttons to setWorkspaceView directly.");
    return updated;
  }
);

/**
 * 5. Patch any remaining top-level Publish button usage outside PreviewToolbar.
 */
source = source
  .split("onClick={openPublishCenter}")
  .join('onClick={() => setWorkspaceView("publish-readiness")}');

source = source
  .split("onClick={onOpenPublishCenter}")
  .join('onClick={() => setWorkspaceView("publish-readiness")}');

/**
 * 6. Ensure PublishReadinessWorkspace receives publishCenterRef.
 */
if (!source.includes("publishCenterRef={publishCenterRef}")) {
  const branchStart = source.indexOf(
    `{!isLoadingWorkspace && workspaceView === "publish-readiness" ? (`
  );

  if (branchStart === -1) {
    fail("Could not find publish-readiness render branch.");
  }

  const componentStart = source.indexOf("<PublishReadinessWorkspace", branchStart);
  const componentEnd = source.indexOf("/>", componentStart);

  if (componentStart === -1 || componentEnd === -1) {
    fail("Could not find PublishReadinessWorkspace render.");
  }

  const oldComponent = source.slice(componentStart, componentEnd + 2);

  const newComponent = oldComponent.replace(
    "/>",
    `  publishCenterRef={publishCenterRef}
            />`
  );

  source =
    source.slice(0, componentStart) +
    newComponent +
    source.slice(componentEnd + 2);

  console.log("Added publishCenterRef to PublishReadinessWorkspace render.");
} else {
  console.log("PublishReadinessWorkspace already receives publishCenterRef.");
}

/**
 * 7. Ensure the Publish Center wrapper has the ref.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("ref={publishCenterRef}")) {
      const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishCenterPanel`;

      if (updated.includes(marker)) {
        updated = updated.replace(
          marker,
          `      <div
        ref={publishCenterRef}
        style={{
          marginBottom: "18px",
          scrollMarginTop: "96px",
        }}
      >
        <PublishCenterPanel`
        );

        console.log("Added ref to PublishCenterPanel wrapper.");
      } else {
        console.log("PublishCenterPanel wrapper marker not found. It may already be customised.");
      }
    } else {
      console.log("PublishCenterPanel wrapper already has ref.");
    }

    return updated;
  }
);

save();

console.log("");
console.log("✅ Publish button simple-scroll repair complete.");
console.log(`Backup created at: ${backupPath}`);