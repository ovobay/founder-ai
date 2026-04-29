import fs from "node:fs";
import path from "node:path";

/**
 * Adds a compact custom-domain verification mini-flow to PublishDropdownPopover.
 *
 * This is still frontend-only, but it gives the product a real publish-system shape:
 * - DNS settings expands inside the dropdown
 * - shows required CNAME record
 * - copy buttons for DNS name/value
 * - verify domain button
 * - domain verification status
 *
 * Real backend DNS verification can be wired later.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-domain-verification-dropdown-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

const startMarker = "function PublishDropdownPopover({";
const endMarker = "function PreviewToolbar({";

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1) {
  fail("Could not find function PublishDropdownPopover.");
}

if (end === -1) {
  fail("Could not find function PreviewToolbar after PublishDropdownPopover.");
}

const replacement = `function PublishDropdownPopover({
  previewState,
  files,
  onClose,
  onOpenReadiness,
}: {
  previewState?: PreviewState;
  files?: ChangedFile[];
  onClose: () => void;
  onOpenReadiness: () => void;
}) {
  // Compact publish control surface.
  // Primary publish controls stay visible. Deeper diagnostics remain behind explicit actions.
  const currentFiles = files ?? [];
  const hasFiles = currentFiles.length > 0;

  const gateReport =
    previewState && hasFiles
      ? getPublishGateReport({
          previewState,
          files: currentFiles,
        })
      : null;

  const generatedUrl = previewState
    ? getGeneratedPreviewUrl(previewState)
    : "https://founder-ai-build.founder-ai.app";

  const [customDomain, setCustomDomain] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDnsSettingsOpen, setIsDnsSettingsOpen] = useState(false);
  const [domainStatus, setDomainStatus] = useState<
    "none" | "needs-dns" | "verifying" | "verified"
  >("none");

  const cleanCustomDomain = customDomain
    .trim()
    .replace(/^https?:\\/\\//, "")
    .replace(/\\/$/, "");

  const dnsRecordName = cleanCustomDomain || "app.yourdomain.com";
  const dnsRecordValue = "cname.founder-ai.app";

  const securityCount = [
    "config/security-review.md",
    "config/security-rules.md",
    "config/publish-gate-report.md",
  ].filter((filePath) => currentFiles.some((file) => file.path === filePath)).length;

  const settingsCount = [
    "config/env.example",
    "config/deploy-checklist.md",
    "config/developer-instructions.md",
    "config/launch-readiness-report.md",
  ].filter((filePath) => currentFiles.some((file) => file.path === filePath)).length;

  const activeUrl = cleanCustomDomain ? \`https://\${cleanCustomDomain}\` : generatedUrl;

  const publishStage =
    !hasFiles || !gateReport
      ? {
          label: "Draft",
          description: "Build something first before publishing.",
        }
      : gateReport.decision === "can-publish"
        ? {
            label: "Ready",
            description: "Checks look healthy. Final human review still matters.",
          }
        : gateReport.decision === "can-stage"
          ? {
              label: "Review",
              description: "Good enough for staging, not production-perfect yet.",
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
    !hasFiles || !gateReport
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

  const domainTone =
    domainStatus === "verified"
      ? {
          label: "Verified",
          background: "#ecfdf5",
          color: "#166534",
          border: "#bbf7d0",
        }
      : domainStatus === "verifying"
        ? {
            label: "Verifying",
            background: "#eff6ff",
            color: "#1d4ed8",
            border: "#bfdbfe",
          }
        : domainStatus === "needs-dns"
          ? {
              label: "Needs DNS",
              background: "#fff7ed",
              color: "#9a3412",
              border: "#fed7aa",
            }
          : {
              label: "No domain",
              background: "#f9fafb",
              color: "#4b5563",
              border: "#e5e7eb",
            };

  const secondaryButtonStyle: React.CSSProperties = {
    minHeight: "38px",
    borderRadius: "13px",
    border: "1px solid #d7dbe3",
    background: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    fontWeight: 750,
    padding: "0 12px",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  };

  async function copyText(value: string, successMessage: string) {
    // Generic clipboard helper for URL and DNS records.
    try {
      await navigator.clipboard.writeText(value);
      setMessage(successMessage);
    } catch {
      setMessage("Could not copy. Select the value and copy it manually.");
    }
  }

  async function copyPublishUrl() {
    // Copy the currently visible publish URL.
    await copyText(activeUrl, "Website URL copied.");
  }

  function updateSnapshot() {
    // Refresh the local publish snapshot status.
    const now = new Date();

    setLastUpdatedLabel(
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    if (!hasFiles || !gateReport) {
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
    // Give fast security feedback without opening the full page.
    if (securityCount >= 3) {
      setMessage("Security handoff files are present. Review them before publishing.");
      return;
    }

    setMessage("Security exports are incomplete. Review security before going live.");
  }

  function editSettings() {
    // Give fast settings feedback without turning the dropdown into a spreadsheet.
    if (settingsCount >= 4) {
      setMessage("Core publish settings exist. Configure real deployment values next.");
      return;
    }

    setMessage("Publish settings are incomplete. Export the remaining setup files.");
  }

  function handleCustomDomainChange(value: string) {
    // Reset domain verification whenever the entered domain changes.
    setCustomDomain(value);

    const nextDomain = value.trim().replace(/^https?:\\/\\//, "").replace(/\\/$/, "");

    if (!nextDomain) {
      setDomainStatus("none");
      return;
    }

    setDomainStatus("needs-dns");
  }

  function openDnsSettings() {
    // Open compact DNS verification instructions inside this dropdown.
    setIsDnsSettingsOpen((current) => !current);

    if (!cleanCustomDomain) {
      setMessage("Enter a custom domain first.");
      setDomainStatus("none");
      return;
    }

    if (domainStatus === "none") {
      setDomainStatus("needs-dns");
    }

    setMessage("Add the DNS record shown below, then verify the domain.");
  }

  function verifyDomain() {
    // Simulated verification. Real DNS lookup/provider verification comes later.
    if (!cleanCustomDomain) {
      setMessage("Enter a custom domain first.");
      setDomainStatus("none");
      return;
    }

    setDomainStatus("verifying");
    setMessage("Checking DNS record...");

    window.setTimeout(() => {
      setDomainStatus("verified");
      setMessage("Domain verified locally. Wire real DNS verification next.");
    }, 650);
  }

  function openFullPublishCenter() {
    // Open deeper publish diagnostics and close the dropdown.
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
        width: "min(420px, calc(100vw - 32px))",
        maxHeight: "min(76vh, 620px)",
        overflowY: "auto",
        borderRadius: "22px",
        border: "1px solid #dde2ea",
        background: "#ffffff",
        boxShadow: "0 26px 60px rgba(15, 23, 42, 0.16)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "16px 16px 13px",
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
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "7px",
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
              margin: "7px 0 0",
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.4,
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
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            border: "1px solid #d7dbe3",
            background: "#f9fafb",
            color: "#111827",
            fontSize: "22px",
            lineHeight: 1,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "14px 16px 16px", display: "grid", gap: "12px" }}>
        <div
          style={{
            border: \`1px solid \${tone.border}\`,
            background: tone.background,
            borderRadius: "17px",
            padding: "12px",
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
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "5px",
              }}
            >
              Status
            </div>

            <div
              style={{
                color: "#111827",
                fontSize: "14px",
                fontWeight: 850,
                lineHeight: 1.25,
              }}
            >
              {gateReport ? \`\${gateReport.label} · \${gateReport.score}%\` : "Draft · 0%"}
            </div>

            <div
              style={{
                color: "#4b5563",
                fontSize: "12px",
                lineHeight: 1.35,
                marginTop: "4px",
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
              fontWeight: 850,
              padding: "7px 11px",
              whiteSpace: "nowrap",
            }}
          >
            {publishStage.label}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eef1f4",
            borderRadius: "17px",
            padding: "12px",
            display: "grid",
            gap: "9px",
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
                fontSize: "14px",
                fontWeight: 850,
              }}
            >
              Website URL
            </div>

            <button
              type="button"
              onClick={copyPublishUrl}
              style={secondaryButtonStyle}
            >
              Copy
            </button>
          </div>

          <div
            style={{
              minHeight: "46px",
              borderRadius: "14px",
              border: "1px solid #d7dbe3",
              background: "#f9fafb",
              padding: "0 13px",
              display: "flex",
              alignItems: "center",
              color: "#111827",
              fontSize: "13px",
              fontWeight: 750,
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
            borderRadius: "17px",
            padding: "12px",
            display: "grid",
            gap: "9px",
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
                fontSize: "14px",
                fontWeight: 850,
              }}
            >
              Custom domain
            </div>

            <span
              style={{
                borderRadius: "999px",
                border: \`1px solid \${domainTone.border}\`,
                background: domainTone.background,
                color: domainTone.color,
                fontSize: "11px",
                fontWeight: 850,
                padding: "6px 9px",
                whiteSpace: "nowrap",
              }}
            >
              {domainTone.label}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "8px",
            }}
          >
            <input
              value={customDomain}
              onChange={(event) => handleCustomDomainChange(event.target.value)}
              placeholder="app.yourdomain.com"
              suppressHydrationWarning
              style={{
                width: "100%",
                minHeight: "44px",
                borderRadius: "14px",
                border: "1px solid #d7dbe3",
                background: "#ffffff",
                color: "#111827",
                fontSize: "13px",
                fontWeight: 650,
                padding: "0 13px",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={openDnsSettings}
              style={{
                ...secondaryButtonStyle,
                minHeight: "44px",
              }}
            >
              DNS
            </button>
          </div>

          {isDnsSettingsOpen ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "15px",
                background: "#f9fafb",
                padding: "11px",
                display: "grid",
                gap: "9px",
              }}
            >
              <div
                style={{
                  color: "#374151",
                  fontSize: "12px",
                  lineHeight: 1.4,
                }}
              >
                Add this CNAME record where your domain DNS is managed. Yes, DNS,
                the ancient ritual humans invented to make websites feel like paperwork.
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "7px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <strong style={{ color: "#111827", fontSize: "12px" }}>Name</strong>
                  <code
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      background: "#ffffff",
                      padding: "7px 8px",
                      color: "#111827",
                      fontSize: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dnsRecordName}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(dnsRecordName, "CNAME name copied.")}
                    style={{
                      ...secondaryButtonStyle,
                      minHeight: "32px",
                      fontSize: "12px",
                      padding: "0 9px",
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <strong style={{ color: "#111827", fontSize: "12px" }}>Value</strong>
                  <code
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      background: "#ffffff",
                      padding: "7px 8px",
                      color: "#111827",
                      fontSize: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dnsRecordValue}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(dnsRecordValue, "CNAME value copied.")}
                    style={{
                      ...secondaryButtonStyle,
                      minHeight: "32px",
                      fontSize: "12px",
                      padding: "0 9px",
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={verifyDomain}
                style={{
                  ...secondaryButtonStyle,
                  width: "100%",
                  minHeight: "38px",
                  background: domainStatus === "verified" ? "#ecfdf5" : "#ffffff",
                  color: domainStatus === "verified" ? "#166534" : "#111827",
                }}
              >
                {domainStatus === "verified"
                  ? "Domain verified"
                  : domainStatus === "verifying"
                    ? "Verifying..."
                    : "Verify domain"}
              </button>
            </div>
          ) : null}
        </div>

        <div
          style={{
            border: "1px solid #eef1f4",
            borderRadius: "17px",
            padding: "12px",
            display: "grid",
            gap: "9px",
          }}
        >
          <div
            style={{
              color: "#111827",
              fontSize: "14px",
              fontWeight: 850,
            }}
          >
            Visibility
          </div>

          <div
            style={{
              display: "flex",
              gap: "9px",
            }}
          >
            {(["public", "private"] as const).map((option) => {
              const isActive = visibility === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVisibility(option)}
                  style={{
                    flex: 1,
                    minHeight: "66px",
                    borderRadius: "15px",
                    border: isActive ? "1px solid #2563eb" : "1px solid #d7dbe3",
                    background: isActive ? "#eff6ff" : "#ffffff",
                    padding: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      color: "#111827",
                      fontSize: "13px",
                      fontWeight: 850,
                      marginBottom: "4px",
                      textTransform: "capitalize",
                    }}
                  >
                    {option}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "11px",
                      lineHeight: 1.35,
                    }}
                  >
                    {option === "public" ? "Anyone with URL." : "Internal only."}
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
            gap: "9px",
          }}
        >
          <button type="button" onClick={reviewSecurity} style={secondaryButtonStyle}>
            Security · {securityCount}
          </button>

          <button type="button" onClick={editSettings} style={secondaryButtonStyle}>
            Settings
          </button>
        </div>

        <button
          type="button"
          onClick={updateSnapshot}
          className="publish-button"
          style={{
            width: "100%",
            minHeight: "44px",
            borderRadius: "15px",
          }}
        >
          Update
        </button>

        <div
          style={{
            display: "flex",
            gap: "9px",
          }}
        >
          <button
            type="button"
            onClick={openFullPublishCenter}
            style={{
              ...secondaryButtonStyle,
              flex: 1,
            }}
          >
            Full publish center
          </button>

          <button
            type="button"
            onClick={() => setIsDetailsOpen((current) => !current)}
            style={{
              ...secondaryButtonStyle,
              minWidth: "112px",
            }}
          >
            {isDetailsOpen ? "Less" : "Details"}
          </button>
        </div>

        {isDetailsOpen ? (
          <div
            style={{
              border: "1px solid #eef1f4",
              borderRadius: "16px",
              background: "#f9fafb",
              padding: "12px",
              display: "grid",
              gap: "7px",
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.45,
            }}
          >
            <div>
              <strong style={{ color: "#111827" }}>Gate:</strong>{" "}
              {gateReport ? gateReport.summary : "No publish gate available yet."}
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Security files:</strong>{" "}
              {securityCount}/3
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Settings files:</strong>{" "}
              {settingsCount}/4
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Visibility:</strong>{" "}
              {visibility === "public" ? "Public" : "Private"}
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Domain:</strong> {domainTone.label}
            </div>
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              borderRadius: "13px",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              padding: "11px 13px",
              color: "#374151",
              fontSize: "12px",
              fontWeight: 750,
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

`;

source = source.slice(0, start) + replacement + source.slice(end);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added custom domain verification mini-flow to PublishDropdownPopover.");
console.log(`Backup created at: ${backupPath}`);