import fs from "node:fs";
import path from "node:path";

/**
 * Robust toolbar repair v2.
 *
 * Fixes:
 * - old floating Account / Session / Sign out slab
 * - duplicate Publish controls
 * - Preview button incorrectly becoming Publish
 *
 * This version finds the toolbar by JSX:
 *   className="preview-toolbar"
 *
 * instead of assuming the function is still named PreviewToolbar.
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");
const cssPath = path.join(root, "app/globals.css");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

let page = fs.readFileSync(pagePath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

const pageBackupPath = path.join(
  root,
  `app/page.backup-before-toolbar-repair-v2-${Date.now()}.tsx`
);

const cssBackupPath = path.join(
  root,
  `app/globals.backup-before-toolbar-repair-v2-${Date.now()}.css`
);

fs.writeFileSync(pageBackupPath, page);
fs.writeFileSync(cssBackupPath, css);

function fail(message) {
  throw new Error(message);
}

function findFunctionRangeFromStart(source, start) {
  const bodyStart = findFunctionBodyStart(source, start);

  if (bodyStart === -1) {
    return null;
  }

  const end = findMatchingBrace(source, bodyStart);

  if (end === -1) {
    return null;
  }

  return {
    start,
    end: end + 1,
  };
}

function findFunctionBodyStart(source, functionStart) {
  /**
   * Handles common forms:
   * function Name(...) { ... }
   * function Name({ ... }: { ... }) { ... }
   */
  const candidates = [
    "}) {",
    "}){",
    ") {",
    "){",
  ];

  let bestIndex = -1;
  let bestMarker = "";

  for (const marker of candidates) {
    const index = source.indexOf(marker, functionStart);

    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
      bestMarker = marker;
    }
  }

  if (bestIndex === -1) {
    return -1;
  }

  return bestIndex + bestMarker.length - 1;
}

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quote) {
      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function findToolbarFunctionRange(source) {
  const toolbarAnchor =
    source.indexOf('className="preview-toolbar"') !== -1
      ? source.indexOf('className="preview-toolbar"')
      : source.indexOf("className='preview-toolbar'");

  if (toolbarAnchor === -1) {
    return null;
  }

  /**
   * Find nearest previous function declaration before the toolbar JSX.
   */
  const beforeToolbar = source.slice(0, toolbarAnchor);
  const functionStart = beforeToolbar.lastIndexOf("function ");

  if (functionStart === -1) {
    return null;
  }

  return findFunctionRangeFromStart(source, functionStart);
}

function removeFunctionByName(functionName) {
  const marker = `function ${functionName}`;
  const start = page.indexOf(marker);

  if (start === -1) {
    console.log(`Function not found, skipped: ${functionName}`);
    return;
  }

  const range = findFunctionRangeFromStart(page, start);

  if (!range) {
    console.log(`Could not safely remove function: ${functionName}`);
    return;
  }

  page = page.slice(0, range.start).trimEnd() + "\n\n" + page.slice(range.end).trimStart();
  console.log(`Removed function: ${functionName}`);
}

function removeCssBlockByTitle(title) {
  const marker = `/* ${title} */`;
  const start = css.indexOf(marker);

  if (start === -1) {
    console.log(`CSS block not found, skipped: ${title}`);
    return;
  }

  const next = css.indexOf("\n/* ", start + marker.length);

  if (next === -1) {
    css = css.slice(0, start).trimEnd() + "\n";
  } else {
    css = css.slice(0, start).trimEnd() + "\n\n" + css.slice(next).trimStart();
  }

  console.log(`Removed CSS block: ${title}`);
}

/**
 * Remove previous broken visible account overlay.
 */
page = page.replaceAll("<AccountControl />", "");
removeFunctionByName("AccountControl");
removeFunctionByName("ToolbarAccountMenu");
removeFunctionByName("PublishToolbarDropdown");

removeCssBlockByTitle("Founder AI account control");
removeCssBlockByTitle("Founder AI repaired toolbar account publish");

/**
 * Locate toolbar function by JSX, not name.
 */
const toolbarRange = findToolbarFunctionRange(page);

if (!toolbarRange) {
  fail(
    [
      "Could not find toolbar function by className=\"preview-toolbar\".",
      "",
      "Run this and paste the output:",
      'grep -n -A 140 -B 60 "preview-toolbar" app/page.tsx',
    ].join("\n")
  );
}

const repairedToolbar = `function PreviewToolbar({
  filesOpen,
  setFilesOpen,
  fileCountLabel,
  workspaceView,
  setWorkspaceView,
  onOpenPublishCenter,
  previewState,
  files,
}: {
  filesOpen: boolean;
  setFilesOpen: (value: boolean) => void;
  fileCountLabel: string;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
  onOpenPublishCenter: () => void;
  previewState?: PreviewState;
  files?: ChangedFile[];
}) {
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const publishMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (publishMenuRef.current?.contains(target)) return;
      if (accountMenuRef.current?.contains(target)) return;

      setIsPublishMenuOpen(false);
      setIsAccountMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPublishMenuOpen(false);
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function getToolButtonClass(active: boolean) {
    return ["tool-button", active ? "tool-button-active" : ""].join(" ");
  }

  return (
    <header className="preview-toolbar repaired-preview-toolbar">
      <div className="repaired-preview-toolbar-left">
        <button
          suppressHydrationWarning
          type="button"
          className="preview-button"
          onClick={() => setWorkspaceView("preview")}
          aria-pressed={workspaceView === "preview"}
        >
          <Globe2 className="icon" />
          Preview
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={getToolButtonClass(filesOpen)}
          aria-label={\`Files: \${fileCountLabel}\`}
          title={fileCountLabel}
          onClick={() => setFilesOpen(!filesOpen)}
        >
          <File className="icon" />
        </button>

        <button suppressHydrationWarning type="button" className="tool-button" aria-label="Cloud">
          <Cloud className="icon" />
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={getToolButtonClass(workspaceView === "code")}
          aria-label="Code"
          aria-pressed={workspaceView === "code"}
          onClick={() => setWorkspaceView("code")}
        >
          <Code2 className="icon" />
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={getToolButtonClass(workspaceView === "architecture")}
          aria-label="Architecture"
          aria-pressed={workspaceView === "architecture"}
          onClick={() => setWorkspaceView("architecture")}
        >
          <BarChart3 className="icon" />
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={getToolButtonClass(workspaceView === "integrations")}
          aria-label="Integrations"
          aria-pressed={workspaceView === "integrations"}
          onClick={() => setWorkspaceView("integrations")}
        >
          <Cloud className="icon" />
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={getToolButtonClass(workspaceView === "publish-readiness")}
          aria-label="Publish readiness"
          aria-pressed={workspaceView === "publish-readiness"}
          onClick={onOpenPublishCenter}
        >
          <Play className="icon" />
        </button>

        <button
          suppressHydrationWarning
          type="button"
          className={getToolButtonClass(workspaceView === "history")}
          aria-label="History"
          aria-pressed={workspaceView === "history"}
          onClick={() => setWorkspaceView("history")}
        >
          <Clock3 className="icon" />
        </button>

        <button suppressHydrationWarning type="button" className="tool-button" aria-label="Security">
          <Shield className="icon" />
        </button>

        <button suppressHydrationWarning type="button" className="tool-button" aria-label="More">
          <MoreHorizontal className="icon" />
        </button>

        <div className="toolbar-route-display" aria-label="Current preview route">
          <span className="toolbar-route-screen" aria-hidden="true">▭</span>
          <span>/</span>
        </div>
      </div>

      <div className="repaired-preview-toolbar-right">
        <button suppressHydrationWarning type="button" className="tool-button toolbar-text-button" aria-label="Share">
          Share
        </button>

        <button suppressHydrationWarning type="button" className="tool-button toolbar-text-button" aria-label="Git">
          Git
        </button>

        <button suppressHydrationWarning type="button" className="upgrade-button">
          Upgrade
        </button>

        <div ref={accountMenuRef} className="toolbar-dropdown-anchor">
          <button
            suppressHydrationWarning
            type="button"
            className="toolbar-account-button"
            aria-label="Open account menu"
            aria-expanded={isAccountMenuOpen}
            onClick={() => {
              setIsPublishMenuOpen(false);
              setIsAccountMenuOpen((current) => !current);
            }}
          >
            A
          </button>

          {isAccountMenuOpen ? (
            <ToolbarAccountMenu onClose={() => setIsAccountMenuOpen(false)} />
          ) : null}
        </div>

        <div ref={publishMenuRef} className="toolbar-dropdown-anchor">
          <button
            suppressHydrationWarning
            type="button"
            className="publish-button"
            aria-label="Open publish menu"
            aria-expanded={isPublishMenuOpen}
            onClick={() => {
              setIsAccountMenuOpen(false);
              setIsPublishMenuOpen((current) => !current);
            }}
          >
            Publish
          </button>

          {isPublishMenuOpen ? (
            <PublishToolbarDropdown
              previewState={previewState}
              files={files ?? []}
              onOpenReadiness={() => {
                setIsPublishMenuOpen(false);
                onOpenPublishCenter();
              }}
              onClose={() => setIsPublishMenuOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ToolbarAccountMenu({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="toolbar-account-menu" role="menu" aria-label="Account menu">
      <div className="toolbar-account-menu-header">
        <strong>Account</strong>
        <span>Session and sign-out controls.</span>
      </div>

      <a href="/auth/session" onClick={onClose} role="menuitem">
        Account
      </a>

      <a href="/auth/session" onClick={onClose} role="menuitem">
        Session
      </a>

      <a href="/auth/signout" onClick={onClose} role="menuitem" className="toolbar-account-menu-danger">
        Sign out
      </a>
    </div>
  );
}

function PublishToolbarDropdown({
  previewState,
  files,
  onOpenReadiness,
  onClose,
}: {
  previewState?: PreviewState;
  files: ChangedFile[];
  onOpenReadiness: () => void;
  onClose: () => void;
}) {
  const [customDomain, setCustomDomain] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");

  const hasPreview = Boolean(previewState);

  const generatedUrl = hasPreview
    ? getGeneratedPreviewUrl(previewState as PreviewState)
    : "No preview URL yet";

  const gateReport = hasPreview
    ? getPublishGateReport({
        previewState: previewState as PreviewState,
        files,
      })
    : null;

  const securityCount = getPublishCenterSecurityCount(files);
  const settingsCount = getPublishCenterSettingsCount(files);

  const activeUrl = customDomain.trim()
    ? \`https://\${customDomain.trim().replace(/^https?:\\/\\//, "")}\`
    : generatedUrl;

  const statusLabel = !hasPreview
    ? "Draft"
    : gateReport?.decision === "can-publish"
      ? "Ready"
      : gateReport?.decision === "can-stage"
        ? "Stage"
        : gateReport?.decision === "can-preview"
          ? "Preview"
          : "Blocked";

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setMessage("Publish URL copied.");
    } catch {
      setMessage("Could not copy URL. Copy it manually.");
    }
  }

  function updateSnapshot() {
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (!hasPreview) {
      setMessage("Build something first before publishing.");
      return;
    }

    if (gateReport?.decision === "blocked") {
      setMessage("Snapshot updated. Publishing is still blocked.");
      return;
    }

    if (gateReport?.decision === "can-preview") {
      setMessage("Snapshot updated. Internal preview is ready.");
      return;
    }

    if (gateReport?.decision === "can-stage") {
      setMessage("Snapshot updated. This build can move to staging.");
      return;
    }

    setMessage("Snapshot updated. This build is close to publish-ready.");
  }

  return (
    <div className="toolbar-publish-dropdown" role="dialog" aria-label="Publish menu">
      <div className="toolbar-publish-dropdown-header">
        <div>
          <span className="toolbar-publish-eyebrow">Publish</span>
          <div className="toolbar-publish-title-row">
            <strong>{statusLabel}</strong>
            <span>{statusLabel}</span>
          </div>
          <p>
            {!hasPreview
              ? "Build something first before publishing."
              : gateReport?.summary ?? "Review the current snapshot before publishing."}
          </p>
          <small>Last update: {lastUpdatedLabel}</small>
        </div>

        <button type="button" onClick={onClose} aria-label="Close publish menu">
          ×
        </button>
      </div>

      <div className="toolbar-publish-dropdown-body">
        <section>
          <div className="toolbar-publish-row-heading">
            <strong>Website URL</strong>
            <button type="button" onClick={copyUrl}>Copy</button>
          </div>

          <div className="toolbar-publish-url" title={activeUrl}>
            {activeUrl}
          </div>
        </section>

        <section>
          <div className="toolbar-publish-row-heading">
            <strong>Custom domain</strong>
            <button type="button" onClick={onOpenReadiness}>DNS settings</button>
          </div>

          <input
            value={customDomain}
            onChange={(event) => setCustomDomain(event.target.value)}
            placeholder="app.yourdomain.com"
          />
        </section>

        <section>
          <strong className="toolbar-publish-section-title">Visibility</strong>

          <div className="toolbar-publish-visibility-grid">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={visibility === "public" ? "is-selected" : ""}
            >
              <strong>Public</strong>
              <span>Anyone with the URL.</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={visibility === "private" ? "is-selected" : ""}
            >
              <strong>Private</strong>
              <span>Internal review only.</span>
            </button>
          </div>
        </section>

        <div className="toolbar-publish-action-grid">
          <button type="button" onClick={onOpenReadiness}>
            Review security · {securityCount}
          </button>

          <button type="button" onClick={onOpenReadiness}>
            Edit settings
          </button>
        </div>

        <button type="button" className="toolbar-publish-update" onClick={updateSnapshot}>
          Update
        </button>

        <div className="toolbar-publish-meta">
          <div>Visibility: {visibility === "public" ? "Public" : "Private"}</div>
          <div>Security files: {securityCount}/3</div>
          <div>Settings files: {settingsCount}/4</div>
        </div>

        {message ? <div className="toolbar-publish-message">{message}</div> : null}
      </div>
    </div>
  );
}`;

page =
  page.slice(0, toolbarRange.start) +
  repairedToolbar +
  page.slice(toolbarRange.end);

console.log("Replaced toolbar function using preview-toolbar JSX anchor.");

/**
 * Add CSS.
 */
if (!css.includes("Founder AI repaired toolbar account publish")) {
  css += `

/* Founder AI repaired toolbar account publish */
.repaired-preview-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 62px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.96);
  z-index: 50;
}

.repaired-preview-toolbar-left,
.repaired-preview-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.repaired-preview-toolbar-left {
  flex: 1;
}

.repaired-preview-toolbar-right {
  flex-shrink: 0;
}

.repaired-preview-toolbar .preview-button,
.repaired-preview-toolbar .tool-button,
.repaired-preview-toolbar .upgrade-button,
.repaired-preview-toolbar .publish-button,
.toolbar-account-button {
  min-height: 42px;
  border-radius: 14px;
  border: 1px solid #d9dde6;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 850;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.repaired-preview-toolbar .preview-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.35);
  background: #eff6ff;
}

.repaired-preview-toolbar .tool-button {
  width: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.repaired-preview-toolbar .toolbar-text-button {
  width: auto;
  min-width: 54px;
}

.repaired-preview-toolbar .tool-button-active {
  border-color: rgba(37, 99, 235, 0.55);
  background: #eff6ff;
  color: #1d4ed8;
}

.repaired-preview-toolbar .upgrade-button {
  padding: 0 16px;
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  color: #ffffff;
  border-color: rgba(124, 58, 237, 0.35);
}

.repaired-preview-toolbar .publish-button {
  padding: 0 18px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.22);
}

.repaired-preview-toolbar button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
}

.repaired-preview-toolbar button:active {
  transform: translateY(0) scale(0.985);
}

.repaired-preview-toolbar .icon {
  width: 17px;
  height: 17px;
}

.toolbar-route-display {
  min-width: 240px;
  flex: 1;
  min-height: 42px;
  border-radius: 15px;
  border: 1px solid #d9dde6;
  background: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: #111827;
  font-size: 19px;
  font-weight: 900;
}

.toolbar-route-screen {
  color: #64748b;
  font-size: 18px;
  margin-right: 9px;
}

.toolbar-dropdown-anchor {
  position: relative;
}

.toolbar-account-button {
  width: 42px;
  padding: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #ffffff;
  border: none;
  font-weight: 950;
}

.toolbar-account-menu,
.toolbar-publish-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.18);
  z-index: 100;
}

.toolbar-account-menu {
  width: 220px;
  border-radius: 18px;
  padding: 10px;
}

.toolbar-account-menu-header {
  padding: 10px 12px 12px;
  border-bottom: 1px solid #eef0f3;
  margin-bottom: 8px;
}

.toolbar-account-menu-header strong {
  display: block;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 4px;
}

.toolbar-account-menu-header span {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.45;
}

.toolbar-account-menu a {
  display: block;
  padding: 11px 12px;
  border-radius: 12px;
  color: #111827;
  text-decoration: none;
  font-size: 14px;
  font-weight: 800;
}

.toolbar-account-menu a:hover {
  background: #f8fafc;
}

.toolbar-account-menu .toolbar-account-menu-danger {
  margin-top: 6px;
  background: #fff1f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.toolbar-publish-dropdown {
  width: min(360px, calc(100vw - 32px));
  border-radius: 22px;
  overflow: hidden;
}

.toolbar-publish-dropdown-header {
  padding: 16px 16px 14px;
  border-bottom: 1px solid #eef0f3;
  background: #fcfcfd;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.toolbar-publish-eyebrow {
  display: block;
  color: #6b7280;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.toolbar-publish-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.toolbar-publish-title-row strong {
  color: #111827;
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.045em;
}

.toolbar-publish-title-row span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 11px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 900;
}

.toolbar-publish-dropdown-header p {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
}

.toolbar-publish-dropdown-header small {
  display: block;
  margin-top: 10px;
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
}

.toolbar-publish-dropdown-header > button {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid #d7dce5;
  background: #ffffff;
  color: #111827;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.toolbar-publish-dropdown-body {
  padding: 14px 16px 16px;
  display: grid;
  gap: 14px;
}

.toolbar-publish-row-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-publish-row-heading strong,
.toolbar-publish-section-title {
  color: #111827;
  font-size: 14px;
  font-weight: 900;
}

.toolbar-publish-row-heading button {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid #d7dce5;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.toolbar-publish-url,
.toolbar-publish-dropdown input {
  width: 100%;
  min-height: 50px;
  border-radius: 15px;
  border: 1px solid #d7dce5;
  background: #f8fafc;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  box-sizing: border-box;
}

.toolbar-publish-url {
  padding: 0 14px;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-publish-dropdown input {
  background: #ffffff;
  padding: 0 14px;
  outline: none;
}

.toolbar-publish-visibility-grid,
.toolbar-publish-action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.toolbar-publish-visibility-grid button {
  min-height: 82px;
  border-radius: 17px;
  border: 1px solid #d7dce5;
  background: #ffffff;
  padding: 13px 14px;
  text-align: left;
  cursor: pointer;
}

.toolbar-publish-visibility-grid button.is-selected {
  border: 2px solid #2563eb;
  background: #eff6ff;
}

.toolbar-publish-visibility-grid strong {
  display: block;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
  margin-bottom: 5px;
}

.toolbar-publish-visibility-grid span {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
}

.toolbar-publish-action-grid button {
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid #d7dce5;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.toolbar-publish-update {
  width: 100%;
  min-height: 52px;
  border-radius: 15px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.26);
}

.toolbar-publish-meta {
  border-top: 1px solid #eef0f3;
  padding-top: 10px;
  display: grid;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.45;
}

.toolbar-publish-message {
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  padding: 12px 14px;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.45;
}

.account-control {
  display: none !important;
}

@media (max-width: 980px) {
  .repaired-preview-toolbar {
    flex-wrap: wrap;
  }

  .repaired-preview-toolbar-left,
  .repaired-preview-toolbar-right {
    width: 100%;
  }

  .toolbar-route-display {
    min-width: 160px;
  }

  .repaired-preview-toolbar-right {
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .toolbar-publish-dropdown {
    right: -8px;
  }

  .toolbar-route-display {
    display: none;
  }
}
`;
}

if (!css.includes("Founder AI old account control safety hide")) {
  css += `

/* Founder AI old account control safety hide */
.account-control {
  display: none !important;
}
`;
}

fs.writeFileSync(pagePath, page);
fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Toolbar repair v2 complete.");
console.log(`Page backup created at: ${pageBackupPath}`);
console.log(`CSS backup created at: ${cssBackupPath}`);