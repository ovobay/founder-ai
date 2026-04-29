import fs from "node:fs";
import path from "node:path";

/**
 * Repairs missing setWorkspaceView plumbing.
 *
 * Problem:
 * PreviewContent renders PublishReadinessWorkspace and passes:
 *   setWorkspaceView={setWorkspaceView}
 *
 * But PreviewContent itself does not receive setWorkspaceView from its parent,
 * so the variable is undefined inside PreviewContent.
 *
 * Fix:
 * - Add setWorkspaceView={setWorkspaceView} to the <PreviewContent /> render.
 * - Add setWorkspaceView to PreviewContent destructured props.
 * - Add setWorkspaceView to PreviewContent prop types.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-preview-content-set-workspace-view-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are fixing plumbing, not testing gravity.
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
 * Finds a JSX opening/self-closing tag by name and returns its full tag block.
 */
function findJsxTagRange(tagName) {
  const start = source.indexOf(`<${tagName}`);

  if (start === -1) {
    return null;
  }

  const selfClosingEnd = source.indexOf("/>", start);
  const openingEnd = source.indexOf(">", start);

  if (selfClosingEnd !== -1 && selfClosingEnd < openingEnd + 5) {
    return {
      start,
      end: selfClosingEnd + 2,
      text: source.slice(start, selfClosingEnd + 2),
    };
  }

  if (openingEnd === -1) {
    return null;
  }

  return {
    start,
    end: openingEnd + 1,
    text: source.slice(start, openingEnd + 1),
  };
}

/**
 * 1. Add setWorkspaceView prop to the parent <PreviewContent /> render.
 */
if (!source.includes("setWorkspaceView={setWorkspaceView}")) {
  const range = findJsxTagRange("PreviewContent");

  if (!range) {
    fail("Could not find <PreviewContent /> render.");
  }

  let patched = range.text;

  if (patched.includes("/>")) {
    patched = patched.replace(
      "/>",
      "  setWorkspaceView={setWorkspaceView}\n            />"
    );
  } else {
    patched = patched.replace(
      ">",
      "\n            setWorkspaceView={setWorkspaceView}\n          >"
    );
  }

  source = source.slice(0, range.start) + patched + source.slice(range.end);

  console.log("Added setWorkspaceView to <PreviewContent /> render.");
} else {
  console.log("<PreviewContent /> render already receives setWorkspaceView.");
}

/**
 * 2. Add setWorkspaceView to PreviewContent props.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function PreviewToolbar(",
  (section) => {
    let updated = section;

    /**
     * Add to destructured props.
     */
    const destructureEnd = updated.indexOf("}: {");

    if (destructureEnd === -1) {
      fail("Could not find PreviewContent destructured props end.");
    }

    const destructureBlock = updated.slice(0, destructureEnd);

    if (!destructureBlock.includes("setWorkspaceView")) {
      updated =
        updated.slice(0, destructureEnd) +
        "  setWorkspaceView,\n" +
        updated.slice(destructureEnd);

      console.log("Added setWorkspaceView to PreviewContent destructured props.");
    } else {
      console.log("PreviewContent destructured props already include setWorkspaceView.");
    }

    /**
     * Add to prop types.
     */
    const typeEnd = updated.indexOf("}) {");

    if (typeEnd === -1) {
      fail("Could not find PreviewContent prop type end.");
    }

    const typeBlock = updated.slice(0, typeEnd);

    if (!typeBlock.includes("setWorkspaceView: (value: WorkspaceView) => void;")) {
      updated =
        updated.slice(0, typeEnd) +
        "  setWorkspaceView: (value: WorkspaceView) => void;\n" +
        updated.slice(typeEnd);

      console.log("Added setWorkspaceView to PreviewContent prop types.");
    } else {
      console.log("PreviewContent prop types already include setWorkspaceView.");
    }

    return updated;
  }
);

save();

console.log("");
console.log("✅ PreviewContent setWorkspaceView repair complete.");
console.log(`Backup created at: ${backupPath}`);