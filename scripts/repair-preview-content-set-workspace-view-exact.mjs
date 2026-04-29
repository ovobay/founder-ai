import fs from "node:fs";
import path from "node:path";

/**
 * Exact repair for PreviewContent missing setWorkspaceView.
 *
 * Current problem:
 * PreviewContent renders PublishReadinessWorkspace and passes:
 *   setWorkspaceView={setWorkspaceView}
 *
 * But PreviewContent itself does not receive setWorkspaceView in its props.
 *
 * This script:
 * - Adds setWorkspaceView to PreviewContent destructured props.
 * - Adds setWorkspaceView to PreviewContent prop types.
 * - Adds setWorkspaceView to the parent <PreviewContent /> render if missing.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-preview-content-set-workspace-view-exact-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are now doing exact surgery, not throwing darts at JSX.
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
 * 1. Add setWorkspaceView to PreviewContent destructured props.
 */
replaceOnce(
  "PreviewContent destructured props",
  `  onCreateFile,
  setWorkspaceError,
}: {`,
  `  onCreateFile,
  setWorkspaceError,
  setWorkspaceView,
}: {`
);

/**
 * 2. Add setWorkspaceView to PreviewContent prop types.
 */
replaceOnce(
  "PreviewContent prop types",
  `  setWorkspaceError: (value: string) => void;
}) {`,
  `  setWorkspaceError: (value: string) => void;
  setWorkspaceView: (value: WorkspaceView) => void;
}) {`
);

/**
 * 3. Add setWorkspaceView to the parent <PreviewContent /> render.
 *
 * We patch the first PreviewContent render block, not every random usage.
 */
const previewRenderStart = source.indexOf("<PreviewContent");

if (previewRenderStart === -1) {
  fail("Could not find <PreviewContent render.");
}

const previewRenderEnd = source.indexOf("/>", previewRenderStart);

if (previewRenderEnd === -1) {
  fail("Could not find end of <PreviewContent render.");
}

const previewRenderBlock = source.slice(previewRenderStart, previewRenderEnd + 2);

if (!previewRenderBlock.includes("setWorkspaceView={setWorkspaceView}")) {
  const patchedPreviewRenderBlock = previewRenderBlock.replace(
    "/>",
    `  setWorkspaceView={setWorkspaceView}
            />`
  );

  source =
    source.slice(0, previewRenderStart) +
    patchedPreviewRenderBlock +
    source.slice(previewRenderEnd + 2);

  console.log("Patched <PreviewContent /> render with setWorkspaceView.");
} else {
  console.log("<PreviewContent /> render already has setWorkspaceView.");
}

/**
 * 4. Validate the exact PreviewContent function now has the prop.
 */
const previewFunctionStart = source.indexOf("function PreviewContent({");
const previewFunctionEnd = source.indexOf("  return (", previewFunctionStart);

if (previewFunctionStart === -1 || previewFunctionEnd === -1) {
  fail("Could not validate PreviewContent function.");
}

const previewFunctionHeader = source.slice(previewFunctionStart, previewFunctionEnd);

if (!previewFunctionHeader.includes("setWorkspaceView,")) {
  fail("PreviewContent destructured props still missing setWorkspaceView.");
}

if (!previewFunctionHeader.includes("setWorkspaceView: (value: WorkspaceView) => void;")) {
  fail("PreviewContent prop types still missing setWorkspaceView.");
}

save();

console.log("");
console.log("✅ PreviewContent setWorkspaceView exact repair complete.");
console.log(`Backup created at: ${backupPath}`);