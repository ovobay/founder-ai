import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add an "Export developer instructions" button.
 *
 * The button saves the technical developer setup guide into the project file tree as:
 * config/developer-instructions.md
 *
 * It uses the existing upsertGeneratedProjectFile helper inside DeployReadinessPanel,
 * so clicking the button once creates the file and clicking it again updates it.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-export-developer-instructions-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Create a backup before patching. Courage is nice. Backups are better.
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
 * Patch DeployReadinessPanel.
 *
 * We add:
 * - export developer instructions state
 * - handleExportDeveloperInstructions()
 * - button + status message
 */
updateBetween(
  "DeployReadinessPanel",
  "function DeployReadinessPanel({",
  "function DeployReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Add state for the export button and export status message.
     */
    if (!updated.includes("const [isExportingDeveloperInstructions")) {
      updated = updated.replace(
        `  const [copyDeveloperMessage, setCopyDeveloperMessage] = useState("");`,
        `  const [copyDeveloperMessage, setCopyDeveloperMessage] = useState("");
  const [
    isExportingDeveloperInstructions,
    setIsExportingDeveloperInstructions,
  ] = useState(false);
  const [developerExportMessage, setDeveloperExportMessage] = useState("");`
      );

      console.log("Added developer instructions export state.");
    } else {
      console.log("Developer instructions export state already exists.");
    }

    /**
     * Add the export handler.
     *
     * It creates or updates config/developer-instructions.md using the existing
     * upsertGeneratedProjectFile helper in DeployReadinessPanel.
     */
    if (!updated.includes("async function handleExportDeveloperInstructions()")) {
      const exportHandler = `

  async function handleExportDeveloperInstructions() {
    setIsExportingDeveloperInstructions(true);
    setDeveloperExportMessage("");
    setWorkspaceError("");

    const filePath = "config/developer-instructions.md";
    const contents = createDeveloperInstructions({
      previewState,
      files,
    });

    try {
      const result = await upsertGeneratedProjectFile({
        filePath,
        contents,
      });

      setDeveloperExportMessage(
        \`config/developer-instructions.md \${result}.\`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export developer instructions.";

      setDeveloperExportMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingDeveloperInstructions(false);
    }
  }`;

      updated = updated.replace(
        `  const blocked = deployItems.filter((item) => item.status === "blocked");`,
        `${exportHandler}

  const blocked = deployItems.filter((item) => item.status === "blocked");`
      );

      console.log("Added handleExportDeveloperInstructions function.");
    } else {
      console.log("handleExportDeveloperInstructions already exists.");
    }

    /**
     * Add the button and status message beside the Copy developer instructions button.
     */
    if (!updated.includes("Export developer instructions")) {
      updated = updated.replace(
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyDeveloperInstructions}
            >
              Copy developer instructions
            </button>

            <span
              style={{
                color:
                  copyDeveloperMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyDeveloperMessage ||
                "Copy exact setup and deployment instructions."}
            </span>`,
        `            <button
              type="button"
              className="pill-button"
              onClick={handleCopyDeveloperInstructions}
            >
              Copy developer instructions
            </button>

            <span
              style={{
                color:
                  copyDeveloperMessage.toLowerCase().includes("failed")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {copyDeveloperMessage ||
                "Copy exact setup and deployment instructions."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportDeveloperInstructions}
              disabled={isExportingDeveloperInstructions}
            >
              {isExportingDeveloperInstructions
                ? "Exporting..."
                : "Export developer instructions"}
            </button>

            <span
              style={{
                color:
                  developerExportMessage.toLowerCase().includes("failed") ||
                  developerExportMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {developerExportMessage ||
                "Save developer setup instructions into the project tree."}
            </span>`
      );

      console.log("Added Export developer instructions UI.");
    } else {
      console.log("Export developer instructions UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ Export developer instructions wiring complete.");
console.log(`Backup created at: ${backupPath}`);