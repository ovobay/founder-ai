import fs from "node:fs";
import path from "node:path";

/**
 * Adds a Publish Center panel to app/page.tsx.
 *
 * The Publish Center gives users a clean, practical publishing interface:
 * - Generated preview URL
 * - Custom domain input
 * - Public/private visibility selector
 * - Security review shortcut
 * - Settings checklist
 * - Update publish snapshot button
 * - Copy URL button
 *
 * This is intentionally not a real deployment backend yet.
 * It creates the product-facing UI layer and client-side state first.
 * The backend/domain provider wiring can come next.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-center-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Product polish is lovely. Rollbacks are lovelier.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function insertBefore(label, marker, insertion) {
  if (source.includes(insertion.trim())) {
    console.log(`Skipping ${label}: already exists.`);
    return;
  }

  if (!source.includes(marker)) {
    die(`Missing marker for ${label}`);
  }

  source = source.replace(marker, `${insertion}${marker}`);
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
 * 1. Add Publish Center helpers and component.
 */
const publishCenterCode = `function createPreviewSlug(value: string) {
  // Converts a project title into a safe generated preview subdomain.
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return slug || "founder-ai-build";
}

function getGeneratedPreviewUrl(previewState: PreviewState) {
  // Local placeholder domain until real deployment provider wiring is added.
  return \`https://\${createPreviewSlug(previewState.title)}.founder-ai.app\`;
}

function getPublishCenterSecurityCount(files: ChangedFile[]) {
  // Counts generated security handoff files so the user sees what has been reviewed/exported.
  return [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => files.some((file) => file.path === filePath)).length;
}

function getPublishCenterSettingsCount(files: ChangedFile[]) {
  // Counts setup files needed before a real production deployment.
  return [
    "config/env.example",
    "config/deploy-checklist.md",
    "config/developer-instructions.md",
    "config/launch-readiness-report.md",
  ].filter((filePath) => files.some((file) => file.path === filePath)).length;
}

function PublishCenterPanel({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {
  const generatedUrl = getGeneratedPreviewUrl(previewState);
  const [customDomain, setCustomDomain] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [publishMessage, setPublishMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");

  const gateReport = getPublishGateReport({
    previewState,
    files,
  });

  const securityCount = getPublishCenterSecurityCount(files);
  const settingsCount = getPublishCenterSettingsCount(files);
  const activeUrl = customDomain.trim()
    ? \`https://\${customDomain.trim().replace(/^https?:\\/\\//, "")}\`
    : generatedUrl;

  const canPublish = gateReport.decision === "can-publish";
  const canStage = gateReport.decision === "can-stage" || canPublish;

  async function copyPublishUrl() {
    // Copies the active publish URL into the clipboard.
    try {
      await navigator.clipboard.writeText(activeUrl);
      setPublishMessage("Website URL copied.");
    } catch {
      setPublishMessage("Could not copy URL. Copy it manually.");
    }
  }

  function updatePublishSnapshot() {
    // Simulates refreshing publish metadata from current generated readiness signals.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (gateReport.decision === "blocked") {
      setPublishMessage("Publish snapshot updated. Gate is still blocked.");
      return;
    }

    if (gateReport.decision === "can-preview") {
      setPublishMessage("Publish snapshot updated. Internal preview is available.");
      return;
    }

    if (gateReport.decision === "can-stage") {
      setPublishMessage("Publish snapshot updated. Staging can be prepared.");
      return;
    }

    setPublishMessage("Publish snapshot updated. Final manual checks still required.");
  }

  function openSecurityReview() {
    // Keeps the user in the current page but directs attention to security work.
    setPublishMessage(
      securityCount >= 2
        ? "Security files exist. Review security review and security rules before publishing."
        : "Security review is incomplete. Export security review and security rules first."
    );
  }

  function openPublishSettings() {
    // Gives an immediate settings verdict without pretending we configured DNS for the user.
    setPublishMessage(
      settingsCount >= 4
        ? "Core publish settings files exist. Configure real environment variables and deployment provider next."
        : "Publish settings are incomplete. Export the full build pack first."
    );
  }

  const decisionTone =
    gateReport.decision === "can-publish"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : gateReport.decision === "blocked"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : gateReport.decision === "can-stage"
          ? {
              background: "#eff6ff",
              border: "#bfdbfe",
              text: "#1d4ed8",
            }
          : {
              background: "#fff7ed",
              border: "#fed7aa",
              text: "#9a3412",
            };

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "18px 20px",
          borderBottom: "1px solid #eef0f3",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,247,241,0.92))",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Publish center
          </div>

          <h2
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "24px",
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
            }}
          >
            Preview, secure, configure, publish
          </h2>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "30px",
            padding: "0 12px",
            borderRadius: "999px",
            background: decisionTone.background,
            color: decisionTone.text,
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {gateReport.label}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
          gap: "0",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRight: "1px solid #eef0f3",
          }}
        >
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 900,
                marginBottom: "9px",
              }}
            >
              Website URL
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                background: "#f9fafb",
                padding: "10px 10px 10px 14px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  color: "#111827",
                  fontSize: "15px",
                  fontWeight: 800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeUrl}
              </span>

              <button
                type="button"
                className="pill-button"
                onClick={copyPublishUrl}
              >
                Copy
              </button>
            </div>
          </div>

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                color: "#111827",
                fontSize: "15px",
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
                minHeight: "46px",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                background: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontWeight: 700,
                padding: "0 14px",
                outline: "none",
              }}
            />

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              Domain connection UI is ready. DNS/provider verification can be wired next.
            </p>
          </div>

          <div>
            <div
              style={{
                color: "#111827",
                fontSize: "15px",
                fontWeight: 900,
                marginBottom: "10px",
              }}
            >
              Who can see this build?
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
                  borderRadius: "18px",
                  background: visibility === "public" ? "#eff6ff" : "#ffffff",
                  padding: "14px",
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
                    lineHeight: 1.4,
                  }}
                >
                  Anyone with the URL can view it.
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
                  borderRadius: "18px",
                  background: visibility === "private" ? "#eff6ff" : "#ffffff",
                  padding: "14px",
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
                    lineHeight: 1.4,
                  }}
                >
                  Keep it internal until staging is ready.
                </span>
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            background: "#fbfaf7",
          }}
        >
          <div
            style={{
              border: \`1px solid \${decisionTone.border}\`,
              borderRadius: "20px",
              background: decisionTone.background,
              padding: "15px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                color: decisionTone.text,
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: "7px",
              }}
            >
              Publish status
            </div>

            <strong
              style={{
                display: "block",
                color: "#111827",
                fontSize: "20px",
                lineHeight: 1.15,
                letterSpacing: "-0.04em",
                marginBottom: "7px",
              }}
            >
              {gateReport.label} · {gateReport.score}%
            </strong>

            <p
              style={{
                margin: 0,
                color: "#374151",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              {gateReport.summary}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <button
              type="button"
              className="pill-button"
              onClick={openSecurityReview}
            >
              Review security
              {securityCount < 2 ? \` · \${2 - securityCount} pending\` : ""}
            </button>

            <button
              type="button"
              className="pill-button"
              onClick={openPublishSettings}
            >
              Edit publish settings
              {settingsCount < 4 ? \` · \${4 - settingsCount} pending\` : ""}
            </button>

            <button
              type="button"
              className="pill-button"
              onClick={updatePublishSnapshot}
            >
              Update publish snapshot
            </button>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              background: "#ffffff",
              padding: "14px",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Snapshot
            </div>

            <div
              style={{
                display: "grid",
                gap: "7px",
                color: "#374151",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              <div>Visibility: {visibility === "public" ? "Public" : "Private"}</div>
              <div>Security files: {securityCount}/3</div>
              <div>Settings files: {settingsCount}/4</div>
              <div>Stage allowed: {canStage ? "Yes" : "No"}</div>
              <div>Publish allowed: {canPublish ? "Yes" : "No"}</div>
              <div>Last update: {lastUpdatedLabel}</div>
            </div>

            {publishMessage ? (
              <p
                style={{
                  margin: "12px 0 0",
                  color: publishMessage.toLowerCase().includes("blocked")
                    ? "#991b1b"
                    : "#166534",
                  fontSize: "12px",
                  fontWeight: 800,
                  lineHeight: 1.45,
                }}
              >
                {publishMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

`;

/**
 * Insert before PublishGatePanel if present, otherwise before OverallLaunchReadinessPanel.
 */
if (!source.includes("function PublishCenterPanel(")) {
  if (source.includes("function PublishGatePanel(")) {
    insertBefore(
      "Publish Center panel",
      "function PublishGatePanel(",
      publishCenterCode
    );
  } else if (source.includes("function OverallLaunchReadinessPanel(")) {
    insertBefore(
      "Publish Center panel",
      "function OverallLaunchReadinessPanel(",
      publishCenterCode
    );
  } else if (source.includes("function PublishReadinessWorkspace(")) {
    insertBefore(
      "Publish Center panel",
      "function PublishReadinessWorkspace(",
      publishCenterCode
    );
  } else {
    die("Could not find a safe place to insert PublishCenterPanel.");
  }

  console.log("Added PublishCenterPanel.");
} else {
  console.log("PublishCenterPanel already exists.");
}

/**
 * 2. Render PublishCenterPanel near the top of PublishReadinessWorkspace.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (updated.includes("<PublishCenterPanel")) {
      console.log("PublishReadinessWorkspace already renders PublishCenterPanel.");
      return updated;
    }

    const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishGatePanel`;

    if (updated.includes(marker)) {
      updated = updated.replace(
        marker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishCenterPanel
          previewState={previewState}
          files={files}
        />
      </div>

${marker}`
      );

      console.log("Rendered PublishCenterPanel before PublishGatePanel.");
      return updated;
    }

    const fallbackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <OverallLaunchReadinessPanel`;

    if (updated.includes(fallbackMarker)) {
      updated = updated.replace(
        fallbackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishCenterPanel
          previewState={previewState}
          files={files}
        />
      </div>

${fallbackMarker}`
      );

      console.log("Rendered PublishCenterPanel before OverallLaunchReadinessPanel.");
      return updated;
    }

    const buildPackMarker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <BuildPackContentsPanel`;

    if (updated.includes(buildPackMarker)) {
      updated = updated.replace(
        buildPackMarker,
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishCenterPanel
          previewState={previewState}
          files={files}
        />
      </div>

${buildPackMarker}`
      );

      console.log("Rendered PublishCenterPanel before BuildPackContentsPanel.");
      return updated;
    }

    console.log("Could not find insertion marker for PublishCenterPanel.");
    return updated;
  }
);

save();

console.log("");
console.log("✅ Publish Center panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);