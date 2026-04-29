import fs from "node:fs";
import path from "node:path";

/**
 * Adds a proper Publish dropdown/popover to app/page.tsx.
 *
 * Goal:
 * - The top Publish button should open a dropdown/popup.
 * - It should NOT navigate the user into a full publish page by default.
 * - The dropdown includes:
 *   - generated preview URL
 *   - custom domain action
 *   - public/private visibility
 *   - review security shortcut
 *   - edit settings shortcut
 *   - update snapshot action
 *
 * This mirrors the interaction model of polished builders:
 * click Publish -> compact publish control panel appears.
 *
 * Deeper Publish readiness still exists as a diagnostics page,
 * but it should not be the primary publish interaction.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-dropdown-popover-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are fixing UX, not playing roulette with JSX.
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

function insertBefore(label, marker, insertion) {
  if (source.includes(insertion.trim())) {
    console.log(`Skipped ${label}: already exists.`);
    return;
  }

  if (!source.includes(marker)) {
    fail(`Could not find marker for ${label}.`);
  }

  source = source.replace(marker, `${insertion}${marker}`);
  console.log(`Added ${label}.`);
}

/**
 * 1. Add publish dropdown helpers and component.
 *
 * This component is intentionally compact.
 * It is meant to live beside the top Publish button, not inside the page body.
 */
const publishDropdownCode = `function getCompactPublishUrl(previewState?: PreviewState) {
  // Creates a stable generated preview URL for the current build.
  const title = previewState?.title || "founder-ai-build";

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return \`https://\${slug || "founder-ai-build"}.founder-ai.app\`;
}

function getCompactPublishSecurityCount(files?: ChangedFile[]) {
  // Counts security-related generated reports.
  const currentFiles = files ?? [];

  return [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => currentFiles.some((file) => file.path === filePath)).length;
}

function PublishDropdownPopover({
  previewState,
  files,
  onOpenReadiness,
  onClose,
}: {
  previewState?: PreviewState;
  files?: ChangedFile[];
  onOpenReadiness: () => void;
  onClose: () => void;
}) {
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [customDomain, setCustomDomain] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");

  const generatedUrl = getCompactPublishUrl(previewState);
  const activeUrl = customDomain.trim()
    ? \`https://\${customDomain.trim().replace(/^https?:\\/\\//, "")}\`
    : generatedUrl;

  const securityCount = getCompactPublishSecurityCount(files);
  const hasFiles = (files ?? []).length > 0;

  async function copyUrl() {
    // Copies the currently active publish URL.
    try {
      await navigator.clipboard.writeText(activeUrl);
      setMessage("Website URL copied.");
    } catch {
      setMessage("Could not copy URL. Copy it manually.");
    }
  }

  function updateSnapshot() {
    // Refreshes the local publish snapshot state.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setMessage(
      hasFiles
        ? "Publish snapshot updated."
        : "No generated files yet. Build something first."
    );
  }

  function reviewSecurity() {
    // Sends users to the deeper readiness view for the full security checks.
    onOpenReadiness();
    onClose();
  }

  function editSettings() {
    // Opens deeper readiness settings/checklists without pretending DNS is already wired.
    onOpenReadiness();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Publish options"
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: "430px",
        maxWidth: "calc(100vw - 28px)",
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 24px 70px rgba(15, 23, 42, 0.20)",
        overflow: "hidden",
        zIndex: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "18px 20px",
          borderBottom: "1px solid #eef0f3",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,247,241,0.96))",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "5px",
            }}
          >
            Publish
          </div>

          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "22px",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Website snapshot
          </strong>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "28px",
            padding: "0 11px",
            borderRadius: "999px",
            background: hasFiles ? "#ecfdf5" : "#fff7ed",
            color: hasFiles ? "#166534" : "#9a3412",
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {hasFiles ? "Ready to review" : "No build yet"}
        </span>
      </div>

      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <strong
            style={{
              color: "#111827",
              fontSize: "14px",
            }}
          >
            Website URL
          </strong>

          <button
            type="button"
            className="pill-button"
            onClick={copyUrl}
          >
            Copy
          </button>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#f9fafb",
            padding: "12px 14px",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 800,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={activeUrl}
        >
          {activeUrl}
        </div>
      </div>

      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <label
          style={{
            display: "block",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 900,
            marginBottom: "9px",
          }}
        >
          Add custom domain
        </label>

        <input
          value={customDomain}
          onChange={(event) => setCustomDomain(event.target.value)}
          placeholder="app.yourdomain.com"
          suppressHydrationWarning
          style={{
            width: "100%",
            minHeight: "44px",
            border: "1px solid #e5e7eb",
            borderRadius: "15px",
            background: "#ffffff",
            color: "#111827",
            fontSize: "14px",
            fontWeight: 700,
            padding: "0 13px",
            outline: "none",
          }}
        />

        <p
          style={{
            margin: "8px 0 0",
            color: "#6b7280",
            fontSize: "12px",
            lineHeight: 1.45,
          }}
        >
          DNS verification can be wired next. This is the product UI layer.
        </p>
      </div>

      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <strong
          style={{
            display: "block",
            color: "#111827",
            fontSize: "14px",
            marginBottom: "10px",
          }}
        >
          Who can see this website?
        </strong>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => setVisibility("public")}
            style={{
              border:
                visibility === "public"
                  ? "1px solid #2563eb"
                  : "1px solid #e5e7eb",
              borderRadius: "16px",
              background: visibility === "public" ? "#eff6ff" : "#ffffff",
              padding: "13px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              Public
            </strong>
            <span
              style={{
                color: "#6b7280",
                fontSize: "12px",
                lineHeight: 1.35,
              }}
            >
              Anyone with the URL.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVisibility("private")}
            style={{
              border:
                visibility === "private"
                  ? "1px solid #2563eb"
                  : "1px solid #e5e7eb",
              borderRadius: "16px",
              background: visibility === "private" ? "#eff6ff" : "#ffffff",
              padding: "13px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              Private
            </strong>
            <span
              style={{
                color: "#6b7280",
                fontSize: "12px",
                lineHeight: 1.35,
              }}
            >
              Internal review only.
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "18px 20px",
          display: "grid",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="pill-button"
            onClick={reviewSecurity}
          >
            Review security
            {securityCount < 3 ? \` · \${3 - securityCount}\` : ""}
          </button>

          <button
            type="button"
            className="pill-button"
            onClick={editSettings}
          >
            Edit settings
          </button>
        </div>

        <button
          type="button"
          className="publish-button"
          onClick={updateSnapshot}
          style={{
            width: "100%",
            minHeight: "44px",
          }}
        >
          Update
        </button>

        <div
          style={{
            borderTop: "1px solid #eef0f3",
            paddingTop: "10px",
            color: "#6b7280",
            fontSize: "12px",
            lineHeight: 1.45,
          }}
        >
          <div>Visibility: {visibility === "public" ? "Public" : "Private"}</div>
          <div>Security files: {securityCount}/3</div>
          <div>Last update: {lastUpdatedLabel}</div>
        </div>

        {message ? (
          <p
            style={{
              margin: 0,
              color: message.toLowerCase().includes("no generated")
                ? "#9a3412"
                : "#166534",
              fontSize: "12px",
              fontWeight: 800,
              lineHeight: 1.45,
            }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

`;

if (!source.includes("function PublishDropdownPopover(")) {
  if (source.includes("function PreviewToolbar(")) {
    insertBefore(
      "Publish dropdown popover",
      "function PreviewToolbar(",
      publishDropdownCode
    );
  } else {
    fail("Could not find function PreviewToolbar to insert PublishDropdownPopover.");
  }
} else {
  console.log("PublishDropdownPopover already exists.");
}

/**
 * 2. Add previewState/files props to PreviewToolbar render.
 */
if (!source.includes("previewState={previewState}") || !source.includes("files={changedFiles}")) {
  const toolbarStart = source.indexOf("<PreviewToolbar");

  if (toolbarStart === -1) {
    fail("Could not find <PreviewToolbar render.");
  }

  const toolbarEnd = source.indexOf("/>", toolbarStart);

  if (toolbarEnd === -1) {
    fail("Could not find end of <PreviewToolbar render.");
  }

  const toolbarBlock = source.slice(toolbarStart, toolbarEnd + 2);

  let patchedToolbarBlock = toolbarBlock;

  if (!patchedToolbarBlock.includes("previewState={previewState}")) {
    patchedToolbarBlock = patchedToolbarBlock.replace(
      "/>",
      "  previewState={previewState}\n            />"
    );
  }

  if (!patchedToolbarBlock.includes("files={changedFiles}")) {
    patchedToolbarBlock = patchedToolbarBlock.replace(
      "/>",
      "  files={changedFiles}\n            />"
    );
  }

  source =
    source.slice(0, toolbarStart) +
    patchedToolbarBlock +
    source.slice(toolbarEnd + 2);

  console.log("Added previewState/files to PreviewToolbar render.");
} else {
  console.log("PreviewToolbar render already has previewState/files.");
}

/**
 * 3. Patch PreviewToolbar component.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function isAssistantBuildWorking(",
  (section) => {
    let updated = section;

    /**
     * Add props to destructuring.
     */
    const destructureEnd = updated.indexOf("}: {");

    if (destructureEnd === -1) {
      fail("Could not find PreviewToolbar destructured props.");
    }

    const destructureBlock = updated.slice(0, destructureEnd);

    if (!destructureBlock.includes("previewState")) {
      updated =
        updated.slice(0, destructureEnd) +
        "  previewState,\n" +
        updated.slice(destructureEnd);

      console.log("Added previewState to PreviewToolbar props.");
    }

    if (!updated.slice(0, destructureEnd + 40).includes("files,")) {
      const newDestructureEnd = updated.indexOf("}: {");

      updated =
        updated.slice(0, newDestructureEnd) +
        "  files,\n" +
        updated.slice(newDestructureEnd);

      console.log("Added files to PreviewToolbar props.");
    }

    /**
     * Add prop types.
     */
    const typeEnd = updated.indexOf("}) {");

    if (typeEnd === -1) {
      fail("Could not find PreviewToolbar prop type end.");
    }

    const typeBlock = updated.slice(0, typeEnd);

    if (!typeBlock.includes("previewState?: PreviewState;")) {
      updated =
        updated.slice(0, typeEnd) +
        "  previewState?: PreviewState;\n" +
        updated.slice(typeEnd);

      console.log("Added previewState type to PreviewToolbar.");
    }

    const latestTypeEnd = updated.indexOf("}) {");

    if (!updated.slice(0, latestTypeEnd).includes("files?: ChangedFile[];")) {
      updated =
        updated.slice(0, latestTypeEnd) +
        "  files?: ChangedFile[];\n" +
        updated.slice(latestTypeEnd);

      console.log("Added files type to PreviewToolbar.");
    }

    /**
     * Add local dropdown state inside PreviewToolbar.
     */
    if (!updated.includes("const [isPublishMenuOpen, setIsPublishMenuOpen]")) {
      const returnMarker = "  return (";

      if (!updated.includes(returnMarker)) {
        fail("Could not find PreviewToolbar return marker.");
      }

      updated = updated.replace(
        returnMarker,
        `  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);

  function openPublishReadinessFromDropdown() {
    // Opens deeper publish diagnostics from the dropdown.
    setWorkspaceView("publish-readiness");
  }

${returnMarker}`
      );

      console.log("Added publish dropdown state to PreviewToolbar.");
    }

    /**
     * Replace top Publish button behavior.
     *
     * It should toggle a dropdown, not navigate directly.
     */
    updated = updated.replace(
      `      <button suppressHydrationWarning
        type="button"
        className="publish-button"
        aria-label="Open publish center"
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        Publish
      </button>`,
      `      <div
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button suppressHydrationWarning
          type="button"
          className="publish-button"
          aria-label="Open publish menu"
          aria-expanded={isPublishMenuOpen}
          onClick={() => setIsPublishMenuOpen((current) => !current)}
        >
          Publish
        </button>

        {isPublishMenuOpen ? (
          <PublishDropdownPopover
            previewState={previewState}
            files={files}
            onOpenReadiness={openPublishReadinessFromDropdown}
            onClose={() => setIsPublishMenuOpen(false)}
          />
        ) : null}
      </div>`
    );

    updated = updated.replace(
      `      <button suppressHydrationWarning
        type="button"
        className="publish-button"
        aria-label="Open publish readiness"
        onClick={() => setWorkspaceView("publish-readiness")}
      >
        Publish
      </button>`,
      `      <div
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button suppressHydrationWarning
          type="button"
          className="publish-button"
          aria-label="Open publish menu"
          aria-expanded={isPublishMenuOpen}
          onClick={() => setIsPublishMenuOpen((current) => !current)}
        >
          Publish
        </button>

        {isPublishMenuOpen ? (
          <PublishDropdownPopover
            previewState={previewState}
            files={files}
            onOpenReadiness={openPublishReadinessFromDropdown}
            onClose={() => setIsPublishMenuOpen(false)}
          />
        ) : null}
      </div>`
    );

    /**
     * Fallback if the button was already partially patched.
     */
    if (!updated.includes("<PublishDropdownPopover")) {
      const publishButtonIndex = updated.indexOf(">Publish</button>");

      if (publishButtonIndex === -1) {
        console.log("Could not find Publish button inside PreviewToolbar fallback.");
        return updated;
      }

      const buttonStart = updated.lastIndexOf("<button", publishButtonIndex);
      const buttonEnd = updated.indexOf("</button>", publishButtonIndex) + "</button>".length;

      if (buttonStart === -1 || buttonEnd === -1) {
        console.log("Could not isolate Publish button fallback.");
        return updated;
      }

      const replacement = `<div
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button suppressHydrationWarning
          type="button"
          className="publish-button"
          aria-label="Open publish menu"
          aria-expanded={isPublishMenuOpen}
          onClick={() => setIsPublishMenuOpen((current) => !current)}
        >
          Publish
        </button>

        {isPublishMenuOpen ? (
          <PublishDropdownPopover
            previewState={previewState}
            files={files}
            onOpenReadiness={openPublishReadinessFromDropdown}
            onClose={() => setIsPublishMenuOpen(false)}
          />
        ) : null}
      </div>`;

      updated =
        updated.slice(0, buttonStart) +
        replacement +
        updated.slice(buttonEnd);

      console.log("Patched Publish button using fallback.");
    }

    return updated;
  }
);

save();

console.log("");
console.log("✅ Publish dropdown popover wiring complete.");
console.log(`Backup created at: ${backupPath}`);