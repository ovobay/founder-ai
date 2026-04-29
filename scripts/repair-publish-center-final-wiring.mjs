import fs from "node:fs";
import path from "node:path";

/**
 * Final repair for Publish Center wiring.
 *
 * Fixes:
 * - Top Publish button should call openPublishCenter()
 * - Left rail Publish readiness icon should call openPublishCenter()
 * - PublishReadinessWorkspace render must receive all required props
 *
 * Required props:
 * - previewState
 * - files
 * - onCreateFile
 * - onSaveFile
 * - setSelectedFileId
 * - setWorkspaceView
 * - setWorkspaceError
 * - publishCenterRef
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-center-final-wiring-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. The app has suffered enough from adventurous patching.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function fail(message) {
  save();
  throw new Error(message);
}

function replaceOnce(label, from, to) {
  if (!source.includes(from)) {
    console.log(`Skipped ${label}: exact block not found.`);
    return false;
  }

  source = source.replace(from, to);
  console.log(`Patched ${label}.`);
  return true;
}

/**
 * 1. Wire the top header Publish button to openPublishCenter().
 */
replaceOnce(
  "top Publish button",
  `      <button suppressHydrationWarning
        type="button"
        className="publish-button"
        aria-label="Open publish readiness"
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        Publish
      </button>`,
  `      <button suppressHydrationWarning
        type="button"
        className="publish-button"
        aria-label="Open publish center"
        onClick={openPublishCenter}
      >
        Publish
      </button>`
);

/**
 * 2. Wire the left rail Publish readiness icon to openPublishCenter().
 */
replaceOnce(
  "left rail publish readiness button",
  `      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "publish-readiness" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Publish readiness"
        aria-pressed={workspaceView === "publish-readiness"}
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        <Play className="icon" />
      </button>`,
  `      <button suppressHydrationWarning
        type="button"
        className={[
          "tool-button",
          workspaceView === "publish-readiness" ? "tool-button-active" : "",
        ].join(" ")}
        aria-label="Publish center"
        aria-pressed={workspaceView === "publish-readiness"}
        onClick={openPublishCenter}
      >
        <Play className="icon" />
      </button>`
);

/**
 * 3. Repair the PublishReadinessWorkspace render props.
 *
 * Your current render is missing required props. This replaces it with the
 * complete prop set expected by the component.
 */
const brokenRender = `          {!isLoadingWorkspace && workspaceView === "publish-readiness" ? (
            <PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              publishCenterRef={publishCenterRef}
        />
          ) : null}`;

const fixedRender = `          {!isLoadingWorkspace && workspaceView === "publish-readiness" ? (
            <PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setSelectedFileId={setSelectedFileId}
              setWorkspaceView={setWorkspaceView}
              setWorkspaceError={setWorkspaceError}
              publishCenterRef={publishCenterRef}
            />
          ) : null}`;

if (!replaceOnce("PublishReadinessWorkspace render props", brokenRender, fixedRender)) {
  /**
   * Fallback repair:
   * Locate the PublishReadinessWorkspace JSX inside the publish-readiness branch
   * and replace only that component block.
   */
  const branchStart = source.indexOf(
    `{!isLoadingWorkspace && workspaceView === "publish-readiness" ? (`
  );

  if (branchStart === -1) {
    fail("Could not find publish-readiness render branch.");
  }

  const componentStart = source.indexOf("<PublishReadinessWorkspace", branchStart);

  if (componentStart === -1) {
    fail("Could not find PublishReadinessWorkspace component render.");
  }

  const componentEnd = source.indexOf("/>", componentStart);

  if (componentEnd === -1) {
    fail("Could not find end of PublishReadinessWorkspace component render.");
  }

  const repairedComponent = `<PublishReadinessWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setSelectedFileId={setSelectedFileId}
              setWorkspaceView={setWorkspaceView}
              setWorkspaceError={setWorkspaceError}
              publishCenterRef={publishCenterRef}
            />`;

  source =
    source.slice(0, componentStart) +
    repairedComponent +
    source.slice(componentEnd + 2);

  console.log("Patched PublishReadinessWorkspace render props using fallback.");
}

/**
 * 4. Check that the names we passed actually exist in app/page.tsx.
 *
 * If any of these fail, the actual functions are named differently and we need
 * the grep output. This makes the failure obvious instead of silently breaking.
 */
const requiredNames = [
  "onCreateFile",
  "onSaveFile",
  "setSelectedFileId",
  "setWorkspaceView",
  "setWorkspaceError",
  "publishCenterRef",
  "openPublishCenter",
];

const missingNames = requiredNames.filter((name) => !source.includes(name));

save();

console.log("");
console.log("✅ Publish Center final wiring repair complete.");
console.log(`Backup created at: ${backupPath}`);

if (missingNames.length > 0) {
  console.log("");
  console.log("⚠️ These expected names were not found:");
  console.log(missingNames.join(", "));
  console.log("");
  console.log("Run:");
  console.log(
    `grep -n "function .*File\\|async function .*File\\|onCreateFile\\|onSaveFile\\|setSelectedFileId" app/page.tsx`
  );
}