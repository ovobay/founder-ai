import fs from "node:fs";
import path from "node:path";

/**
 * Replaces PublishDropdownPopover in app/page.tsx with a more compact,
 * more user-friendly publish panel.
 *
 * The new publish dropdown:
 * - is shorter and more focused
 * - keeps primary actions visible
 * - hides secondary detail behind a "More details" toggle
 * - preserves the current in-product publish workflow
 *
 * In other words: less panel sprawl, more adult supervision.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-compact-publish-dropdown-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

function findFunctionRange(functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return null;
  }

  const openBraceIndex = source.indexOf("{", start);

  if (openBraceIndex === -1) {
    return null;
  }

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingle) {
      if (!escaped && char === "'") {
        inSingle = false;
      }
      escaped = !escaped && char === "\\";
      continue;
    }

    if (inDouble) {
      if (!escaped && char === '"') {
        inDouble = false;
      }
      escaped = !escaped && char === "\\";
      continue;
    }

    if (inTemplate) {
      if (!escaped && char === "`") {
        inTemplate = false;
      }
      escaped = !escaped && char === "\\";
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

    if (char === "'") {
      inSingle = true;
      escaped = false;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      escaped = false;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      escaped = false;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
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

const range = findFunctionRange("PublishDropdownPopover");

if (!range) {
  fail("Could not find function PublishDropdownPopover in app/page.tsx");
}

const replacement = `function PublishDropdownPopover({
  previewState,
  files,
  onClose,
  onOpenReadiness,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onClose: () => void;
  onOpenReadiness: () => void;
}) {
  // Compact publish control surface.
  // This is intentionally smaller and more focused than the old version.
  const gateReport = getPublishGateReport({
    previewState,
    files,
  });

  const generatedUrl = getGeneratedPreviewUrl(previewState);
  const [customDomain, setCustomDomain] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // These counts help keep the dropdown informative without dumping the full readiness page into it.
  const securityCount = [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => files.some((file) => file.path === filePath)).length;

  const settingsCount = [
    "config/env.example",
    "config/deploy-checklist.md",
    "config/developer-instructions.md",
    "config/launch-readiness-report.md",
  ].filter((filePath) => files.some((file) => file.path === filePath)).length;

  const activeUrl = customDomain.trim()
    ? \`https://\${customDomain.trim().replace(/^https?:\\/\\//, "")}\`
    : generatedUrl;

  const publishStage =
    files.length === 0
      ? {
          label: "Draft",
          description: "Build something first before publishing.",
        }
      : gateReport.decision === "can-publish"
        ? {
            label: "Ready",
            description: "Looks healthy. Final human review still matters.",
          }
        : gateReport.decision === "can-stage"
          ? {
              label: "Review",
              description: "Good enough for staging, not yet production-perfect.",
            }
          : gateReport.decision === "can-preview"
            ? {
                label: "Preview",
                description: "Internal preview is fine. More setup is still required.",
              }
            : {
                label: "Blocked",
                description: "Fix blockers before pretending this should go live.",
              };

  const tone =
    files.length === 0
      ? {
          background: "#fff7ed",
          border: "#fdba74",
          badgeBackground: "#ffedd5",
          badgeColor: "#9a3412",
        }
      : gateReport.decision === "can-publish"
        ? {
            background: "#ecfdf5",
            border: "#86efac",
            badgeBackground: "#dcfce7",
            badgeColor: "#166534",
          }
        : gateReport.decision === "can-stage"
          ? {
              background: "#eff6ff",
              border: "#93c5fd",
              badgeBackground: "#dbeafe",
              badgeColor: "#1d4ed8",
            }
          : gateReport.decision === "can-preview"
            ? {
                background: "#f5f3ff",
                border: "#c4b5fd",
                badgeBackground: "#ede9fe",
                badgeColor: "#6d28d9",
              }
            : {
                background: "#fef2f2",
                border: "#fca5a5",
                badgeBackground: "#fee2e2",
                badgeColor: "#991b1b",
              };

  const secondaryButtonStyle: React.CSSProperties = {
    minHeight: "42px",
    borderRadius: "14px",
    border: "1px solid #d7dbe3",
    background: "#ffffff",
    color: "#111827",
    fontSize: "14px",
    fontWeight: 700,
    padding: "0 14px",
    cursor: "pointer",
    transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  };

  const optionCardBaseStyle: React.CSSProperties = {
    flex: 1,
    minHeight: "74px",
    borderRadius: "16px",
    border: "1px solid #d7dbe3",
    background: "#ffffff",
    padding: "14px",
    textAlign: "left",
    cursor: "pointer",
    transition: "transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
  };

  async function copyPublishUrl() {
    // Copies the visible URL.
    try {
      await navigator.clipboard.writeText(activeUrl);
      setMessage("Website URL copied.");
    } catch {
      setMessage("Could not copy the URL. Copy it manually instead.");
    }
  }

  function updateSnapshot() {
    // Refreshes the publish snapshot summary.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (files.length === 0) {
      setMessage("No generated files yet. Build something first.");
      return;
    }

    if (gateReport.decision === "blocked") {
      setMessage("Snapshot updated. Publishing is still blocked.");
      return;
    }

    if (gateReport.decision === "can-preview") {
      setMessage("Snapshot updated. Internal preview is ready.");
      return;
    }

    if (gateReport.decision === "can-stage") {
      setMessage("Snapshot updated. Staging looks viable.");
      return;
    }

    setMessage("Snapshot updated. Final manual review is still recommended.");
  }

  function reviewSecurity() {
    // Gives the user a short verdict while allowing deeper review elsewhere.
    if (securityCount >= 3) {
      setMessage("Security handoff files are present. Review them before publishing.");
      return;
    }

    setMessage("Security exports are incomplete. Review security before going live.");
  }

  function editSettings() {
    // Gives the user a short publish-settings verdict.
    if (settingsCount >= 4) {
      setMessage("Core publish settings exist. Configure real deployment values next.");
      return;
    }

    setMessage("Publish settings are incomplete. Export the remaining setup files.");
  }

  function openDnsSettings() {
    // Compact placeholder until real DNS verification flow is wired.
    if (!customDomain.trim()) {
      setMessage("Enter a custom domain first.");
      return;
    }

    setMessage("DNS settings panel can be wired next. The domain field is ready.");
  }

  function openFullPublishCenter() {
    // Opens the full publish workspace and closes the dropdown.
    onOpenReadiness();
    onClose();
  }

  return (
    <div
      style={{
        width: "min(460px, calc(100vw - 32px))",
        maxHeight: "min(78vh, 680px)",
        overflowY: "auto",
        borderRadius: "22px",
        border: "1px solid #dde2ea",
        background: "#ffffff",
        boxShadow: "0 26px 60px rgba(15, 23, 42, 0.16)",
      }}
    >
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid #eef1f4",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Publish
          </div>

          <h2
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "18px",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {publishStage.label}
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.45,
            }}
          >
            {publishStage.description}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close publish panel"
          onClick={onClose}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "999px",
            border: "1px solid #d7dbe3",
            background: "#f9fafb",
            color: "#111827",
            fontSize: "24px",
            lineHeight: 1,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "16px 18px 18px", display: "grid", gap: "14px" }}>
        <div
          style={{
            border: \`1px solid \${tone.border}\`,
            background: tone.background,
            borderRadius: "18px",
            padding: "14px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
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
                marginBottom: "6px",
              }}
            >
              Status
            </div>

            <div
              style={{
                color: "#111827",
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: "4px",
              }}
            >
              {gateReport.label} · {gateReport.score}%
            </div>

            <div
              style={{
                color: "#4b5563",
                fontSize: "12px",
                lineHeight: 1.45,
              }}
            >
              Last update: {lastUpdatedLabel}
            </div>
          </div>

          <div
            style={{
              alignSelf: "flex-start",
              borderRadius: "999px",
              background: tone.badgeBackground,
              color: tone.badgeColor,
              fontSize: "12px",
              fontWeight: 800,
              padding: "8px 12px",
              whiteSpace: "nowrap",
            }}
          >
            {publishStage.label}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eef1f4",
            borderRadius: "18px",
            padding: "14px",
            display: "grid",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div
              style={{
                color: "#111827",
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              Website URL
            </div>

            <button
              type="button"
              onClick={copyPublishUrl}
              className="ui-pressable"
              style={secondaryButtonStyle}
            >
              Copy
            </button>
          </div>

          <div
            style={{
              minHeight: "52px",
              borderRadius: "15px",
              border: "1px solid #d7dbe3",
              background: "#f9fafb",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              color: "#111827",
              fontSize: "14px",
              fontWeight: 700,
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
            border: "1px solid #eef1f4",
            borderRadius: "18px",
            padding: "14px",
            display: "grid",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div
              style={{
                color: "#111827",
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              Custom domain
            </div>

            <button
              type="button"
              onClick={openDnsSettings}
              className="ui-pressable"
              style={{
                ...secondaryButtonStyle,
                minHeight: "36px",
                padding: "0 12px",
                fontSize: "13px",
              }}
            >
              DNS settings
            </button>
          </div>

          <input
            value={customDomain}
            onChange={(event) => setCustomDomain(event.target.value)}
            placeholder="app.yourdomain.com"
            style={{
              width: "100%",
              minHeight: "52px",
              borderRadius: "15px",
              border: "1px solid #d7dbe3",
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              fontWeight: 600,
              padding: "0 14px",
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            border: "1px solid #eef1f4",
            borderRadius: "18px",
            padding: "14px",
            display: "grid",
            gap: "10px",
          }}
        >
          <div
            style={{
              color: "#111827",
              fontSize: "15px",
              fontWeight: 800,
            }}
          >
            Visibility
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            {(["public", "private"] as const).map((option) => {
              const isActive = visibility === option;

              return (
                <button
                  key={option}
                  type="button"
                  className="ui-pressable"
                  onClick={() => setVisibility(option)}
                  style={{
                    ...optionCardBaseStyle,
                    border: isActive ? "1px solid #2563eb" : optionCardBaseStyle.border,
                    background: isActive ? "#eff6ff" : "#ffffff",
                    boxShadow: isActive
                      ? "0 0 0 1px rgba(37, 99, 235, 0.08)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      color: "#111827",
                      fontSize: "14px",
                      fontWeight: 800,
                      marginBottom: "6px",
                      textTransform: "capitalize",
                    }}
                  >
                    {option}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "12px",
                      lineHeight: 1.4,
                    }}
                  >
                    {option === "public"
                      ? "Anyone with the URL can view it."
                      : "Keep it internal until you are ready."}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={reviewSecurity}
            className="ui-pressable"
            style={secondaryButtonStyle}
          >
            Review security · {securityCount}
          </button>

          <button
            type="button"
            onClick={editSettings}
            className="ui-pressable"
            style={secondaryButtonStyle}
          >
            Edit settings
          </button>
        </div>

        <button
          type="button"
          onClick={updateSnapshot}
          className="publish-button ui-pressable"
          style={{
            width: "100%",
            minHeight: "46px",
            borderRadius: "16px",
          }}
        >
          Update
        </button>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={openFullPublishCenter}
            className="ui-pressable"
            style={{
              ...secondaryButtonStyle,
              flex: 1,
            }}
          >
            Open full publish center
          </button>

          <button
            type="button"
            onClick={() => setIsDetailsOpen((current) => !current)}
            className="ui-pressable"
            style={{
              ...secondaryButtonStyle,
              minWidth: "122px",
            }}
          >
            {isDetailsOpen ? "Less details" : "More details"}
          </button>
        </div>

        {isDetailsOpen ? (
          <div
            style={{
              border: "1px solid #eef1f4",
              borderRadius: "18px",
              background: "#f9fafb",
              padding: "14px",
              display: "grid",
              gap: "8px",
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            <div>
              <strong style={{ color: "#111827" }}>Gate:</strong> {gateReport.summary}
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Security files:</strong> {securityCount}/3
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Settings files:</strong> {settingsCount}/4
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Visibility:</strong>{" "}
              {visibility === "public" ? "Public" : "Private"}
            </div>
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              padding: "12px 14px",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}`;

source = source.slice(0, range.start) + replacement + source.slice(range.end);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Replaced PublishDropdownPopover with a compact publish panel.");
console.log(`Backup created at: ${backupPath}`);