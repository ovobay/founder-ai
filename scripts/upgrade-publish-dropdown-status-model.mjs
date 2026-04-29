import fs from "node:fs";
import path from "node:path";

/**
 * Upgrades PublishDropdownPopover to use the real publish gate model.
 *
 * Before:
 * - Status was mostly based on file/security counts.
 *
 * After:
 * - Status comes from getPublishGateReport().
 * - The dropdown shows a clearer state:
 *   - Draft
 *   - Needs review
 *   - Staging ready
 *   - Ready to publish
 *
 * It also keeps:
 * - URL copy
 * - custom domain input
 * - visibility selector
 * - Review security
 * - Edit settings
 * - Update
 * - Open full publish readiness
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-dropdown-status-model-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. The dropdown works now, so naturally we tempt fate responsibly.
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

  const bodyStartMarker = source.indexOf(") {", start);
  const bodyStart = bodyStartMarker === -1 ? -1 : bodyStartMarker + 2;

  if (bodyStart === -1) return null;

  let depth = 0;
  let inString = false;
  let quote = "";
  let inTemplate = false;
  let escaped = false;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === quote) {
        inString = false;
        quote = "";
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`") inTemplate = false;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "/" && next === "/") {
      const lineEnd = source.indexOf("\n", index);
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (char === "/" && next === "*") {
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

const upgradedPublishDropdown = `function PublishDropdownPopover({
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

  const currentFiles = files ?? [];
  const generatedUrl = getCompactPublishUrl(previewState);
  const activeUrl = customDomain.trim()
    ? \`https://\${customDomain.trim().replace(/^https?:\\/\\//, "")}\`
    : generatedUrl;

  const securityCount = getCompactPublishSecurityCount(currentFiles);
  const hasFiles = currentFiles.length > 0;

  const gateReport =
    previewState && currentFiles.length > 0
      ? getPublishGateReport({
          previewState,
          files: currentFiles,
        })
      : null;

  const publishState =
    !hasFiles || !gateReport
      ? "draft"
      : gateReport.decision === "blocked"
        ? "blocked"
        : gateReport.decision === "can-preview"
          ? "needs-review"
          : gateReport.decision === "can-stage"
            ? "staging-ready"
            : "ready-to-publish";

  const statusLabel =
    publishState === "draft"
      ? "Draft"
      : publishState === "blocked"
        ? "Blocked"
        : publishState === "needs-review"
          ? "Needs review"
          : publishState === "staging-ready"
            ? "Staging ready"
            : "Ready to publish";

  const statusDescription =
    publishState === "draft"
      ? "Build something first before publishing."
      : publishState === "blocked"
        ? "Resolve blockers before previewing or staging."
        : publishState === "needs-review"
          ? "Internal preview is available, but staging is not ready."
          : publishState === "staging-ready"
            ? "This can move to staging for review and testing."
            : "Generated checks pass. Run final manual review before production.";

  const statusTone =
    publishState === "ready-to-publish"
      ? {
          background: "#ecfdf5",
          text: "#166534",
          border: "#bbf7d0",
        }
      : publishState === "staging-ready"
        ? {
            background: "#eff6ff",
            text: "#1d4ed8",
            border: "#bfdbfe",
          }
        : publishState === "blocked"
          ? {
              background: "#fef2f2",
              text: "#991b1b",
              border: "#fecaca",
            }
          : {
              background: "#fff7ed",
              text: "#9a3412",
              border: "#fed7aa",
            };

  const actionLabel =
    publishState === "ready-to-publish"
      ? "Update publish snapshot"
      : publishState === "staging-ready"
        ? "Prepare staging snapshot"
        : publishState === "needs-review"
          ? "Update preview snapshot"
          : "Update";

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
    // Refreshes the local publish snapshot state using the current publish gate.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (!hasFiles) {
      setMessage("No generated files yet. Build something first.");
      return;
    }

    if (publishState === "blocked") {
      setMessage("Snapshot updated. Publishing is still blocked.");
      return;
    }

    if (publishState === "needs-review") {
      setMessage("Preview snapshot updated. Review before staging.");
      return;
    }

    if (publishState === "staging-ready") {
      setMessage("Staging snapshot updated. Run tests before production.");
      return;
    }

    setMessage("Publish snapshot updated. Final manual review still required.");
  }

  function openReadinessAndClose() {
    // Opens deeper diagnostics from the compact publish popover.
    onOpenReadiness();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Publish options"
      style={{
        position: "fixed",
        top: "58px",
        right: "18px",
        width: "420px",
        maxWidth: "calc(100vw - 28px)",
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        background: "#ffffff",
        boxShadow: "0 26px 80px rgba(15, 23, 42, 0.22)",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid #eef0f3",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,247,241,0.96))",
        }}
      >
        <div
          style={{
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
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: "6px",
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
                letterSpacing: "-0.045em",
              }}
            >
              {statusLabel}
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close publish menu"
            style={{
              width: "32px",
              height: "32px",
              border: "1px solid #e5e7eb",
              borderRadius: "999px",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: "9px",
            marginTop: "14px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              minHeight: "28px",
              padding: "0 11px",
              borderRadius: "999px",
              border: \`1px solid \${statusTone.border}\`,
              background: statusTone.background,
              color: statusTone.text,
              fontSize: "12px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
            {gateReport ? \` · \${gateReport.score}%\` : ""}
          </span>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.45,
            }}
          >
            {statusDescription}
          </p>

          <span
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Last update: {lastUpdatedLabel}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "16px 18px",
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
            padding: "12px 13px",
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
          padding: "16px 18px",
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
            Custom domain
          </strong>

          <button
            type="button"
            onClick={openReadinessAndClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 900,
              cursor: "pointer",
              padding: 0,
            }}
          >
            DNS settings
          </button>
        </div>

        <input
          value={customDomain}
          onChange={(event) => setCustomDomain(event.target.value)}
          placeholder="app.yourdomain.com"
          suppressHydrationWarning
          style={{
            width: "100%",
            minHeight: "42px",
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
      </div>

      <div
        style={{
          padding: "16px 18px",
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
          Visibility
        </strong>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {(["public", "private"] as const).map((option) => {
            const selected = visibility === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setVisibility(option)}
                style={{
                  border: selected ? "1px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: "16px",
                  background: selected ? "#eff6ff" : "#ffffff",
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
                    textTransform: "capitalize",
                  }}
                >
                  {option}
                </strong>

                <span
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    lineHeight: 1.35,
                  }}
                >
                  {option === "public"
                    ? "Anyone with the URL."
                    : "Internal review only."}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "16px 18px",
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
            onClick={openReadinessAndClose}
          >
            Review security
            {securityCount < 3 ? \` · \${3 - securityCount}\` : ""}
          </button>

          <button
            type="button"
            className="pill-button"
            onClick={openReadinessAndClose}
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
          {actionLabel}
        </button>

        <button
          type="button"
          onClick={openReadinessAndClose}
          style={{
            border: "none",
            background: "transparent",
            color: "#4b5563",
            fontSize: "12px",
            fontWeight: 900,
            cursor: "pointer",
            padding: "2px 0 0",
            textAlign: "center",
          }}
        >
          Open full publish readiness
        </button>

        {message ? (
          <p
            style={{
              margin: 0,
              color: message.toLowerCase().includes("blocked") ||
                message.toLowerCase().includes("no generated")
                ? "#9a3412"
                : "#166534",
              fontSize: "12px",
              fontWeight: 800,
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}`;

const range = findFunctionRange("PublishDropdownPopover");

if (!range) {
  fail("Could not find function PublishDropdownPopover().");
}

source =
  source.slice(0, range.start) +
  upgradedPublishDropdown +
  source.slice(range.end);

save();

console.log("");
console.log("✅ Publish dropdown status model upgraded.");
console.log(`Backup created at: ${backupPath}`);