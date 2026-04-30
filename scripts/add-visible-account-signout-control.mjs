import fs from "node:fs";
import path from "node:path";

/**
 * Adds a visible Account / Session / Sign out control to app/page.tsx.
 *
 * This is intentionally CSS + component-light:
 * - Adds a small AccountControl component.
 * - Places it near the main app shell/header when a safe marker is found.
 * - Adds CSS polish for the control.
 *
 * If the exact header marker is not found, the script prints what to inspect
 * instead of smashing JSX with a shovel. Growth, frankly.
 */

const root = process.cwd();
const pagePath = path.join(root, "app/page.tsx");
const cssPath = path.join(root, "app/globals.css");

const pageBackupPath = path.join(
  root,
  `app/page.backup-before-account-signout-control-${Date.now()}.tsx`
);

const cssBackupPath = path.join(
  root,
  `app/globals.backup-before-account-signout-control-${Date.now()}.css`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

if (!fs.existsSync(cssPath)) {
  throw new Error(`Could not find ${cssPath}`);
}

let page = fs.readFileSync(pagePath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

fs.writeFileSync(pageBackupPath, page);
fs.writeFileSync(cssBackupPath, css);

function fail(message) {
  throw new Error(message);
}

/**
 * 1. Add AccountControl component before PreviewToolbar or before the first
 * obvious toolbar/header component.
 */
if (!page.includes("function AccountControl(")) {
  const component = `function AccountControl() {
  // Visible auth shortcuts for checking the current session and signing out.
  return (
    <div className="account-control" aria-label="Account controls">
      <a className="account-control-link account-control-link-muted" href="/auth/session">
        Account
      </a>

      <a className="account-control-link account-control-link-muted" href="/auth/session">
        Session
      </a>

      <a className="account-control-link account-control-link-danger" href="/auth/signout">
        Sign out
      </a>
    </div>
  );
}

`;

  const insertMarkers = [
    "function PreviewToolbar(",
    "function Header(",
    "function AppHeader(",
    "function TopBar(",
    "export default function",
  ];

  const marker = insertMarkers.find((value) => page.includes(value));

  if (!marker) {
    fail(
      "Could not find a safe component insertion marker for AccountControl."
    );
  }

  page = page.replace(marker, component + marker);
  console.log(`Added AccountControl before marker: ${marker}`);
} else {
  console.log("AccountControl already exists.");
}

/**
 * 2. Try to place <AccountControl /> in the main visible page.
 *
 * Preferred: inside the main app shell/header area.
 * Conservative fallback: add it right after the first top-level opening
 * app shell div/class if found.
 */
if (!page.includes("<AccountControl />")) {
  const placementAttempts = [
    {
      name: "inside preview toolbar header",
      from: `<header className="preview-toolbar">`,
      to: `<header className="preview-toolbar">
      <AccountControl />`,
    },
    {
      name: "inside app shell",
      from: `<div className="app-shell">`,
      to: `<div className="app-shell">
      <AccountControl />`,
    },
    {
      name: "inside command center",
      from: `<div className="command-center">`,
      to: `<div className="command-center">
      <AccountControl />`,
    },
    {
      name: "inside main",
      from: `<main`,
      to: `<main`,
      custom: true,
    },
  ];

  let placed = false;

  for (const attempt of placementAttempts) {
    if (!page.includes(attempt.from)) {
      continue;
    }

    if (attempt.custom && attempt.from === "<main") {
      /**
       * Add AccountControl after the first opening <main ...> tag.
       */
      const mainStart = page.indexOf("<main");
      const mainOpenEnd = page.indexOf(">", mainStart);

      if (mainStart !== -1 && mainOpenEnd !== -1) {
        page =
          page.slice(0, mainOpenEnd + 1) +
          `
      <AccountControl />` +
          page.slice(mainOpenEnd + 1);

        placed = true;
        console.log("Placed AccountControl inside first <main>.");
        break;
      }
    }

    page = page.replace(attempt.from, attempt.to);
    placed = true;
    console.log(`Placed AccountControl using marker: ${attempt.name}`);
    break;
  }

  if (!placed) {
    console.log("");
    console.log("⚠️ Could not place <AccountControl /> automatically.");
    console.log("The component was added, but not rendered yet.");
    console.log("");
    console.log("Run this and paste the output:");
    console.log(
      'grep -n -A 80 -B 40 "return (" app/page.tsx | head -n 180'
    );
  }
} else {
  console.log("AccountControl is already rendered.");
}

/**
 * 3. Add CSS.
 */
if (!css.includes("Founder AI account control")) {
  css += `

/* Founder AI account control */
.account-control {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 10020;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow:
    0 16px 34px rgba(15, 23, 42, 0.10),
    0 1px 0 rgba(255, 255, 255, 0.86) inset;
  backdrop-filter: blur(12px);
  padding: 4px;
}

.account-control-link {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 850;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    color 140ms ease,
    box-shadow 140ms ease;
}

.account-control-link-muted {
  color: #374151;
}

.account-control-link-muted:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

.account-control-link-danger {
  background: #fef2f2;
  color: #991b1b;
}

.account-control-link-danger:hover {
  background: #fee2e2;
  color: #7f1d1d;
}

.account-control-link:hover {
  transform: translateY(-1px);
}

.account-control-link:active {
  transform: translateY(0) scale(0.985);
}

@media (max-width: 760px) {
  .account-control {
    top: 10px;
    right: 10px;
    gap: 4px;
  }

  .account-control-link {
    min-height: 28px;
    padding: 0 9px;
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-control-link {
    transition: none;
  }

  .account-control-link:hover,
  .account-control-link:active {
    transform: none;
  }
}
`;

  console.log("Added account control CSS.");
} else {
  console.log("Account control CSS already exists.");
}

fs.writeFileSync(pagePath, page);
fs.writeFileSync(cssPath, css);

console.log("");
console.log("✅ Visible Account / Session / Sign out control added.");
console.log(`Page backup created at: ${pageBackupPath}`);
console.log(`CSS backup created at: ${cssBackupPath}`);