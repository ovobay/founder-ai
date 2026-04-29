import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-wire-publish-button-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function updateBetween(label, startMarker, endMarker, updater) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    die(`Could not find section: ${label}`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  source = before + updater(section) + after;
}

/**
 * 1. Make sure PreviewToolbar has setWorkspaceView in props.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function PreviewContent({",
  (section) => {
    let updated = section;

    if (!updated.includes("setWorkspaceView,")) {
      die("PreviewToolbar does not contain setWorkspaceView. Your file shape is unexpected.");
    }

    /**
     * 2. Replace Publish button with a functional button.
     */
    if (!updated.includes('aria-label="Open publish readiness"')) {
      updated = updated.replace(
        `      <button type="button" className="publish-button">
        Publish
      </button>`,
        `      <button
        type="button"
        className="publish-button"
        aria-label="Open publish readiness"
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        Publish
      </button>`
      );

      console.log("Wired Publish button to publish-readiness view.");
    } else {
      console.log("Publish button already wired.");
    }

    /**
     * 3. Also wire Upgrade to integrations view, because paid features need Stripe/Supabase readiness.
     */
    if (!updated.includes('aria-label="Open integration readiness"')) {
      updated = updated.replace(
        `      <button type="button" className="upgrade-button">
        Upgrade
      </button>`,
        `      <button
        type="button"
        className="upgrade-button"
        aria-label="Open integration readiness"
        onClick={() => setWorkspaceView("integrations")}
      >
        Upgrade
      </button>`
      );

      console.log("Wired Upgrade button to integrations view.");
    } else {
      console.log("Upgrade button already wired.");
    }

    return updated;
  }
);

save();

console.log("✅ Publish and Upgrade buttons wired.");
console.log(`Backup created at: ${backupPath}`);