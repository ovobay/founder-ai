import fs from "node:fs";
import path from "node:path";

/**
 * Adds one-panel-at-a-time behavior to PublishDropdownPopover.
 *
 * When opening:
 * - DNS panel closes Security, Settings, Details
 * - Security panel closes DNS, Settings, Details
 * - Settings panel closes DNS, Security, Details
 * - Details panel closes DNS, Security, Settings
 *
 * This keeps the dropdown compact and prevents the UI from turning into
 * a vertical furniture catalogue.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-one-panel-publish-dropdown-${Date.now()}.tsx`
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

let section = source.slice(start, end);

/**
 * 1. Add shared close helper after the style object.
 */
if (!section.includes("function closeOtherPublishPanels")) {
  const marker = `  const secondaryButtonStyle: React.CSSProperties = {
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

`;

  if (!section.includes(marker)) {
    fail("Could not find secondaryButtonStyle marker.");
  }

  section = section.replace(
    marker,
    `${marker}  function closeOtherPublishPanels(panel: "dns" | "security" | "settings" | "details") {
    // Keep only one compact publish panel open at a time.
    if (panel !== "dns") setIsDnsSettingsOpen(false);
    if (panel !== "security") setIsSecurityPanelOpen(false);
    if (panel !== "settings") setIsSettingsPanelOpen(false);
    if (panel !== "details") setIsDetailsOpen(false);
  }

`
  );

  console.log("Added closeOtherPublishPanels helper.");
} else {
  console.log("closeOtherPublishPanels helper already exists.");
}

/**
 * 2. Patch DNS opener.
 */
const oldDnsFunction = `  function openDnsSettings() {
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
  }`;

const newDnsFunction = `  function openDnsSettings() {
    // Open compact DNS verification instructions inside this dropdown.
    closeOtherPublishPanels("dns");
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
  }`;

if (section.includes(oldDnsFunction)) {
  section = section.replace(oldDnsFunction, newDnsFunction);
  console.log("Patched DNS panel opener.");
} else {
  console.log("Skipped DNS opener: exact block not found.");
}

/**
 * 3. Patch Security opener.
 */
const oldSecurityFunction = `  function reviewSecurity() {
    // Toggle the compact security panel and close the settings panel.
    setIsSecurityPanelOpen((current) => !current);
    setIsSettingsPanelOpen(false);

    if (securityCount >= 3) {
      setMessage("Security checks are ready for manual review.");
      return;
    }

    setMessage("Security checks are incomplete. Open full publish center for exports.");
  }`;

const newSecurityFunction = `  function reviewSecurity() {
    // Toggle the compact security panel and close the other compact panels.
    closeOtherPublishPanels("security");
    setIsSecurityPanelOpen((current) => !current);

    if (securityCount >= 3) {
      setMessage("Security checks are ready for manual review.");
      return;
    }

    setMessage("Security checks are incomplete. Open full publish center for exports.");
  }`;

if (section.includes(oldSecurityFunction)) {
  section = section.replace(oldSecurityFunction, newSecurityFunction);
  console.log("Patched Security panel opener.");
} else {
  console.log("Skipped Security opener: exact block not found.");
}

/**
 * 4. Patch Settings opener.
 */
const oldSettingsFunction = `  function editSettings() {
    // Toggle the compact settings panel and close the security panel.
    setIsSettingsPanelOpen((current) => !current);
    setIsSecurityPanelOpen(false);

    if (settingsCount >= 4) {
      setMessage("Core publish settings are present.");
      return;
    }

    setMessage("Publish settings are incomplete. Open full publish center for setup exports.");
  }`;

const newSettingsFunction = `  function editSettings() {
    // Toggle the compact settings panel and close the other compact panels.
    closeOtherPublishPanels("settings");
    setIsSettingsPanelOpen((current) => !current);

    if (settingsCount >= 4) {
      setMessage("Core publish settings are present.");
      return;
    }

    setMessage("Publish settings are incomplete. Open full publish center for setup exports.");
  }`;

if (section.includes(oldSettingsFunction)) {
  section = section.replace(oldSettingsFunction, newSettingsFunction);
  console.log("Patched Settings panel opener.");
} else {
  console.log("Skipped Settings opener: exact block not found.");
}

/**
 * 5. Patch Details button inline handler.
 */
const oldDetailsHandler = `onClick={() => setIsDetailsOpen((current) => !current)}`;

const newDetailsHandler = `onClick={() => {
              closeOtherPublishPanels("details");
              setIsDetailsOpen((current) => !current);
            }}`;

if (section.includes(oldDetailsHandler)) {
  section = section.replaceAll(oldDetailsHandler, newDetailsHandler);
  console.log("Patched Details panel opener.");
} else {
  console.log("Skipped Details opener: exact handler not found.");
}

/**
 * 6. Replace repaired section.
 */
source = source.slice(0, start) + section + source.slice(end);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added one-panel-at-a-time behavior to PublishDropdownPopover.");
console.log(`Backup created at: ${backupPath}`);