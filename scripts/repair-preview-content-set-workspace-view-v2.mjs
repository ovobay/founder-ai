import fs from "node:fs";
import path from "node:path";

/**
 * Repairs missing setWorkspaceView inside PreviewContent using brace scanning.
 *
 * The older script failed because it expected PreviewContent to end before
 * function PreviewToolbar(), but your file structure has changed.
 *
 * This version:
 * - Finds function PreviewContent(...) by name
 * - Scans braces to find the real function end
 * - Adds setWorkspaceView to destructured props
 * - Adds setWorkspaceView to the prop type block
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-preview-content-set-workspace-view-v2-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because this file is now basically a historical battlefield.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function fail(message) {
  save();
  throw new Error(message);
}

function findFunctionRange(functionName) {
  const start = source.indexOf(`function ${functionName}(`);

  if (start === -1) return null;

  const bodyStart = source.indexOf("{", start);

  if (bodyStart === -1) return null;

  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let inTemplate = false;
  let escaped = false;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === stringQuote) {
        inString = false;
        stringQuote = "";
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`") {
        inTemplate = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const lineEnd = source.indexOf("\n", index);
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 1;
      continue;
    }

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start,
          end: index + 1,
          text: source.slice(start, index + 1),
        };
      }
    }
  }

  return null;
}

/**
 * 1. Patch PreviewContent function props.
 */
const range = findFunctionRange("PreviewContent");

if (!range) {
  fail("Could not find function PreviewContent(). Run grep command from the next step.");
}

let section = range.text;

/**
 * Add setWorkspaceView to destructured props.
 */
const propsTypeStart = section.indexOf("}: {");

if (propsTypeStart === -1) {
  fail("Could not find PreviewContent props type marker `}: {`.");
}

const destructuredProps = section.slice(0, propsTypeStart);

if (!destructuredProps.includes("setWorkspaceView")) {
  section =
    section.slice(0, propsTypeStart) +
    "  setWorkspaceView,\n" +
    section.slice(propsTypeStart);

  console.log("Added setWorkspaceView to PreviewContent destructured props.");
} else {
  console.log("PreviewContent destructured props already include setWorkspaceView.");
}

/**
 * Add setWorkspaceView to prop type block.
 */
const propsEnd = section.indexOf("}) {");

if (propsEnd === -1) {
  fail("Could not find PreviewContent props ending `}) {`.");
}

const propsTypeBlock = section.slice(propsTypeStart, propsEnd);

if (!propsTypeBlock.includes("setWorkspaceView: (value: WorkspaceView) => void;")) {
  section =
    section.slice(0, propsEnd) +
    "  setWorkspaceView: (value: WorkspaceView) => void;\n" +
    section.slice(propsEnd);

  console.log("Added setWorkspaceView to PreviewContent prop types.");
} else {
  console.log("PreviewContent prop types already include setWorkspaceView.");
}

/**
 * 2. Put the patched PreviewContent function back.
 */
source = source.slice(0, range.start) + section + source.slice(range.end);

/**
 * 3. Make sure the PreviewContent render receives the prop.
 */
if (!source.includes("setWorkspaceView={setWorkspaceView}")) {
  const previewRenderStart = source.indexOf("<PreviewContent");

  if (previewRenderStart === -1) {
    fail("Could not find <PreviewContent render.");
  }

  const previewRenderEnd = source.indexOf("/>", previewRenderStart);

  if (previewRenderEnd === -1) {
    fail("Could not find end of <PreviewContent render.");
  }

  const renderBlock = source.slice(previewRenderStart, previewRenderEnd + 2);

  const patchedRenderBlock = renderBlock.replace(
    "/>",
    "  setWorkspaceView={setWorkspaceView}\n            />"
  );

  source =
    source.slice(0, previewRenderStart) +
    patchedRenderBlock +
    source.slice(previewRenderEnd + 2);

  console.log("Added setWorkspaceView to <PreviewContent /> render.");
} else {
  console.log("<PreviewContent /> render already receives setWorkspaceView.");
}

save();

console.log("");
console.log("✅ PreviewContent setWorkspaceView v2 repair complete.");
console.log(`Backup created at: ${backupPath}`);