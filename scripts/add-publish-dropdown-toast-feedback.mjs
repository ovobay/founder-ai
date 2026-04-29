import fs from "node:fs";
import path from "node:path";

/**
 * Adds compact toast feedback inside PublishDropdownPopover.
 *
 * Before:
 * - Message feedback appeared as a normal block at the bottom.
 * - That stretched the dropdown vertically.
 *
 * After:
 * - Feedback appears as a compact floating toast inside the dropdown.
 * - Toast auto-hides.
 * - The old bottom message block is removed.
 *
 * Because feedback should inform the user, not remodel the panel.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const cssPath = path.join(process.cwd(), "app/globals.css");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-dropdown-toast-${Date.now()}.tsx`
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
 * 1. Add toast state after message state.
 */
if (!section.includes("const [toastMessage, setToastMessage]")) {
  const marker = `  const [message, setMessage] = useState("");
`;

  if (!section.includes(marker)) {
    fail("Could not find message state marker.");
  }

  section = section.replace(
    marker,
    `${marker}  const [toastMessage, setToastMessage] = useState("");
`
  );

  console.log("Added toastMessage state.");
} else {
  console.log("toastMessage state already exists.");
}

/**
 * 2. Add toast helper after secondaryButtonStyle.
 */
if (!section.includes("function showPublishToast")) {
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
    `${marker}  function showPublishToast(value: string) {
    // Show compact feedback without increasing dropdown height.
    setMessage(value);
    setToastMessage(value);

    window.setTimeout(() => {
      setToastMessage((current) => (current === value ? "" : current));
    }, 2600);
  }

`
  );

  console.log("Added showPublishToast helper.");
} else {
  console.log("showPublishToast helper already exists.");
}

/**
 * 3. Replace setMessage calls with showPublishToast inside this component.
 * Keep state name for compatibility, but feedback now appears as toast.
 */
section = section.replaceAll("setMessage(", "showPublishToast(");

/**
 * The helper itself got changed by replaceAll. Restore its internal setter call.
 */
section = section.replace(
  `    showPublishToast(value);
    setToastMessage(value);`,
  `    setMessage(value);
    setToastMessage(value);`
);

/**
 * 4. Remove bottom message block if present.
 */
const messageBlock = `        {message ? (
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
        ) : null}`;

if (section.includes(messageBlock)) {
  section = section.replace(messageBlock, "");
  console.log("Removed bottom message block.");
} else {
  console.log("Bottom message block not found. It may already be removed or modified.");
}

/**
 * 5. Add toast UI just before the closing wrapper div.
 */
if (!section.includes("publish-dropdown-toast")) {
  const closingMarker = `      </div>
    </div>
  );
}`;

  if (!section.includes(closingMarker)) {
    fail("Could not find dropdown closing marker.");
  }

  const toastUi = `      </div>

      {toastMessage ? (
        <div
          className="publish-dropdown-toast"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}`;

  section = section.replace(closingMarker, toastUi);
  console.log("Added toast UI.");
} else {
  console.log("Toast UI already exists.");
}

/**
 * 6. Put patched section back.
 */
source = source.slice(0, start) + section + source.slice(end);

/**
 * 7. Add toast CSS.
 */
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");

  if (!css.includes("publishDropdownToastIn")) {
    css += `

/* Publish dropdown toast feedback */
.publish-dropdown-toast {
  position: sticky;
  bottom: 12px;
  margin: 0 16px 14px;
  z-index: 2;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 14px;
  background: rgba(17, 24, 39, 0.94);
  color: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.22);
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  animation: publishDropdownToastIn 180ms ease-out both;
}

@keyframes publishDropdownToastIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .publish-dropdown-toast {
    animation: none;
  }
}
`;

    fs.writeFileSync(cssPath, css);
    console.log("Added publish dropdown toast CSS.");
  } else {
    console.log("Publish dropdown toast CSS already exists.");
  }
} else {
  console.log("app/globals.css not found. Skipped toast CSS.");
}

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Added compact toast feedback to PublishDropdownPopover.");
console.log(`Backup created at: ${backupPath}`);