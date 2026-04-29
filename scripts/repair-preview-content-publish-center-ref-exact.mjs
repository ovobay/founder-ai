import fs from "node:fs";
import path from "node:path";

/**
 * Exact repair for PreviewContent missing publishCenterRef.
 *
 * Current problem:
 * PreviewContent renders PublishReadinessWorkspace and passes:
 *   publishCenterRef={publishCenterRef}
 *
 * But PreviewContent itself does not receive publishCenterRef in its props.
 *
 * This script:
 * - Adds publishCenterRef to PreviewContent destructured props.
 * - Adds publishCenterRef to PreviewContent prop types.
 * - Adds publishCenterRef to the parent <PreviewContent /> render if missing.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-preview-content-publish-center-ref-exact-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because apparently props now need passports.
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
 * 1. Add publishCenterRef to PreviewContent destructured props.
 */
replaceOnce(
  "PreviewContent destructured props",
  `  setWorkspaceError,
  setWorkspaceView,
}: {`,
  `  setWorkspaceError,
  setWorkspaceView,
  publishCenterRef,
}: {`
);

/**
 * Fallback if order differs.
 */
if (!source.slice(source.indexOf("function PreviewContent({"), source.indexOf("  return (", source.indexOf("function PreviewContent({"))).includes("publishCenterRef,")) {
  replaceOnce(
    "PreviewContent destructured props fallback",
    `  setWorkspaceView,
}: {`,
    `  setWorkspaceView,
  publishCenterRef,
}: {`
  );
}

/**
 * 2. Add publishCenterRef to PreviewContent prop types.
 */
replaceOnce(
  "PreviewContent prop types",
  `  setWorkspaceView: (value: WorkspaceView) => void;
}) {`,
  `  setWorkspaceView: (value: WorkspaceView) => void;
  publishCenterRef?: React.RefObject<HTMLDivElement | null>;
}) {`
);

/**
 * 3. Add publishCenterRef to the parent <PreviewContent /> render.
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

if (!previewRenderBlock.includes("publishCenterRef={publishCenterRef}")) {
  const patchedPreviewRenderBlock = previewRenderBlock.replace(
    "/>",
    `  publishCenterRef={publishCenterRef}
            />`
  );

  source =
    source.slice(0, previewRenderStart) +
    patchedPreviewRenderBlock +
    source.slice(previewRenderEnd + 2);

  console.log("Patched <PreviewContent /> render with publishCenterRef.");
} else {
  console.log("<PreviewContent /> render already has publishCenterRef.");
}

/**
 * 4. Validate PreviewContent now has the prop.
 */
const previewFunctionStart = source.indexOf("function PreviewContent({");
const previewFunctionEnd = source.indexOf("  return (", previewFunctionStart);

if (previewFunctionStart === -1 || previewFunctionEnd === -1) {
  fail("Could not validate PreviewContent function.");
}

const previewFunctionHeader = source.slice(previewFunctionStart, previewFunctionEnd);

if (!previewFunctionHeader.includes("publishCenterRef,")) {
  fail("PreviewContent destructured props still missing publishCenterRef.");
}

if (!previewFunctionHeader.includes("publishCenterRef?: React.RefObject<HTMLDivElement | null>;")) {
  fail("PreviewContent prop types still missing publishCenterRef.");
}

save();

console.log("");
console.log("✅ PreviewContent publishCenterRef exact repair complete.");
console.log(`Backup created at: ${backupPath}`);