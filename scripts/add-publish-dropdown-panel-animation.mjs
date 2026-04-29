import fs from "node:fs";
import path from "node:path";

/**
 * Adds animated reveal behaviour to inline Publish dropdown panels.
 *
 * Panels affected:
 * - DNS settings
 * - Security readiness
 * - Publish settings
 * - Details
 *
 * This adds:
 * - a small PublishRevealPanel component
 * - CSS keyframes in app/globals.css
 * - wrapper usage around the existing inline panels
 *
 * The result is a cleaner, smoother dropdown interaction without turning the UI
 * into a theme park ride for buttons.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const cssPath = path.join(process.cwd(), "app/globals.css");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-panel-animation-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

const dropdownStartMarker = "function PublishDropdownPopover({";
const toolbarStartMarker = "function PreviewToolbar({";

const dropdownStart = source.indexOf(dropdownStartMarker);
const toolbarStart = source.indexOf(toolbarStartMarker, dropdownStart);

if (dropdownStart === -1) {
  fail("Could not find function PublishDropdownPopover.");
}

if (toolbarStart === -1) {
  fail("Could not find function PreviewToolbar after PublishDropdownPopover.");
}

let section = source.slice(dropdownStart, toolbarStart);

/**
 * 1. Add PublishRevealPanel before PublishDropdownPopover if missing.
 */
if (!source.includes("function PublishRevealPanel({")) {
  const revealComponent = `function PublishRevealPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared wrapper for compact dropdown panels.
  // It gives inline publish panels a gentle entrance animation.
  return <div className="publish-reveal-panel">{children}</div>;
}

`;

  source =
    source.slice(0, dropdownStart) +
    revealComponent +
    source.slice(dropdownStart);

  console.log("Added PublishRevealPanel component.");
} else {
  console.log("PublishRevealPanel component already exists.");
}

/**
 * Because we may have inserted content before the dropdown, recalculate markers.
 */
const newDropdownStart = source.indexOf(dropdownStartMarker);
const newToolbarStart = source.indexOf(toolbarStartMarker, newDropdownStart);

if (newDropdownStart === -1 || newToolbarStart === -1) {
  fail("Could not recalculate PublishDropdownPopover section.");
}

section = source.slice(newDropdownStart, newToolbarStart);

/**
 * 2. Wrap the DNS panel.
 */
const oldDnsPanelStart = `          {isDnsSettingsOpen ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "15px",
                background: "#f9fafb",
                padding: "11px",
                display: "grid",
                gap: "9px",
              }}
            >`;

const newDnsPanelStart = `          {isDnsSettingsOpen ? (
            <PublishRevealPanel>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "15px",
                  background: "#f9fafb",
                  padding: "11px",
                  display: "grid",
                  gap: "9px",
                }}
              >`;

const oldDnsPanelEnd = `              <button
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
          ) : null}`;

const newDnsPanelEnd = `              <button
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
          </PublishRevealPanel>
          ) : null}`;

if (section.includes(oldDnsPanelStart) && section.includes(oldDnsPanelEnd)) {
  section = section.replace(oldDnsPanelStart, newDnsPanelStart);
  section = section.replace(oldDnsPanelEnd, newDnsPanelEnd);
  console.log("Wrapped DNS panel with PublishRevealPanel.");
} else {
  console.log("Skipped DNS panel wrapper: exact block not found or already changed.");
}

/**
 * 3. Wrap the Security panel.
 */
const oldSecurityPanelStart = `        {isSecurityPanelOpen ? (
          <div
            style={{
              border: "1px solid #eef1f4",
              borderRadius: "16px",
              background: "#f9fafb",
              padding: "12px",
              display: "grid",
              gap: "10px",
            }}
          >`;

const newSecurityPanelStart = `        {isSecurityPanelOpen ? (
          <PublishRevealPanel>
            <div
              style={{
                border: "1px solid #eef1f4",
                borderRadius: "16px",
                background: "#f9fafb",
                padding: "12px",
                display: "grid",
                gap: "10px",
              }}
            >`;

const oldSecurityPanelEnd = `            <button
              type="button"
              onClick={openFullPublishCenter}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open security review
            </button>
          </div>
        ) : null}`;

const newSecurityPanelEnd = `            <button
              type="button"
              onClick={openFullPublishCenter}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open security review
            </button>
          </div>
        </PublishRevealPanel>
        ) : null}`;

if (section.includes(oldSecurityPanelStart) && section.includes(oldSecurityPanelEnd)) {
  section = section.replace(oldSecurityPanelStart, newSecurityPanelStart);
  section = section.replace(oldSecurityPanelEnd, newSecurityPanelEnd);
  console.log("Wrapped Security panel with PublishRevealPanel.");
} else {
  console.log("Skipped Security panel wrapper: exact block not found or already changed.");
}

/**
 * 4. Wrap the Settings panel.
 */
const oldSettingsPanelStart = `        {isSettingsPanelOpen ? (
          <div
            style={{
              border: "1px solid #eef1f4",
              borderRadius: "16px",
              background: "#f9fafb",
              padding: "12px",
              display: "grid",
              gap: "10px",
            }}
          >`;

const newSettingsPanelStart = `        {isSettingsPanelOpen ? (
          <PublishRevealPanel>
            <div
              style={{
                border: "1px solid #eef1f4",
                borderRadius: "16px",
                background: "#f9fafb",
                padding: "12px",
                display: "grid",
                gap: "10px",
              }}
            >`;

const oldSettingsPanelEnd = `            <button
              type="button"
              onClick={openFullPublishCenter}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open publish settings
            </button>
          </div>
        ) : null}`;

const newSettingsPanelEnd = `            <button
              type="button"
              onClick={openFullPublishCenter}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
              }}
            >
              Open publish settings
            </button>
          </div>
        </PublishRevealPanel>
        ) : null}`;

if (section.includes(oldSettingsPanelStart) && section.includes(oldSettingsPanelEnd)) {
  section = section.replace(oldSettingsPanelStart, newSettingsPanelStart);
  section = section.replace(oldSettingsPanelEnd, newSettingsPanelEnd);
  console.log("Wrapped Settings panel with PublishRevealPanel.");
} else {
  console.log("Skipped Settings panel wrapper: exact block not found or already changed.");
}

/**
 * 5. Wrap the Details panel.
 */
const oldDetailsPanelStart = `        {isDetailsOpen ? (
          <div
            style={{
              border: "1px solid #eef1f4",
              borderRadius: "16px",
              background: "#f9fafb",
              padding: "12px",
              display: "grid",
              gap: "10px",
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.45,
            }}
          >`;

const newDetailsPanelStart = `        {isDetailsOpen ? (
          <PublishRevealPanel>
            <div
              style={{
                border: "1px solid #eef1f4",
                borderRadius: "16px",
                background: "#f9fafb",
                padding: "12px",
                display: "grid",
                gap: "10px",
                color: "#4b5563",
                fontSize: "12px",
                lineHeight: 1.45,
              }}
            >`;

const oldDetailsPanelEnd = `          </div>
        ) : null}

        <button
          type="button"
          onClick={resetPublishState}`;

const newDetailsPanelEnd = `          </div>
        </PublishRevealPanel>
        ) : null}

        <button
          type="button"
          onClick={resetPublishState}`;

if (section.includes(oldDetailsPanelStart) && section.includes(oldDetailsPanelEnd)) {
  section = section.replace(oldDetailsPanelStart, newDetailsPanelStart);
  section = section.replace(oldDetailsPanelEnd, newDetailsPanelEnd);
  console.log("Wrapped Details panel with PublishRevealPanel.");
} else {
  console.log("Skipped Details panel wrapper: exact block not found or already changed.");
}

/**
 * 6. Put the patched dropdown section back.
 */
source =
  source.slice(0, newDropdownStart) +
  section +
  source.slice(newToolbarStart);

/**
 * 7. Add CSS animation.
 */
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");

  if (!css.includes("publishRevealPanelIn")) {
    css += `

/* Publish dropdown inline panel reveal */
.publish-reveal-panel {
  animation: publishRevealPanelIn 160ms ease-out both;
  transform-origin: top center;
}

@keyframes publishRevealPanelIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .publish-reveal-panel {
    animation: none;
  }
}
`;

    fs.writeFileSync(cssPath, css);
    console.log("Added publish panel animation CSS.");
  } else {
    console.log("Publish panel animation CSS already exists.");
  }
} else {
  console.log("app/globals.css not found. Skipped CSS animation.");
}

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added animated reveal panels to PublishDropdownPopover.");
console.log(`Backup created at: ${backupPath}`);