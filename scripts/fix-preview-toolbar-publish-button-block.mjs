import fs from "node:fs";
import path from "node:path";

/**
 * Final robust Publish dropdown repair.
 *
 * This version:
 * - Does not look for exact `>Publish</button>`
 * - Finds PreviewToolbar
 * - Finds the LAST button with className="publish-button" inside PreviewToolbar
 * - Replaces it with a working dropdown wrapper
 * - Keeps existing PreviewToolbar props/state/effects
 * - Forces the dropdown to fixed top-right positioning
 * - Adds button press animation CSS
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const cssPath = path.join(process.cwd(), "app/globals.css");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-final-publish-dropdown-button-fix-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
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

function ensureDropdownState(section) {
  let updated = section;

  if (!updated.includes("const [isPublishMenuOpen, setIsPublishMenuOpen]")) {
    const returnMatch = updated.match(/\breturn\s*\(/);

    if (!returnMatch || typeof returnMatch.index !== "number") {
      fail("Could not find PreviewToolbar return statement.");
    }

    const stateBlock = `  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const publishMenuRef = useRef<HTMLDivElement | null>(null);

  function openPublishReadinessFromDropdown() {
    // Opens deeper publish diagnostics from the dropdown.
    setIsPublishMenuOpen(false);
    setWorkspaceView("publish-readiness");
  }

  useEffect(() => {
    // Close Publish dropdown on outside click or Escape.
    if (!isPublishMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (publishMenuRef.current?.contains(target)) return;

      setIsPublishMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPublishMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPublishMenuOpen]);

`;

    updated =
      updated.slice(0, returnMatch.index) +
      stateBlock +
      updated.slice(returnMatch.index);

    console.log("Added Publish dropdown state/ref/effect.");
  } else {
    console.log("Publish dropdown state already exists.");
  }

  if (!updated.includes("function openPublishReadinessFromDropdown()")) {
    const returnMatch = updated.match(/\breturn\s*\(/);

    if (!returnMatch || typeof returnMatch.index !== "number") {
      fail("Could not find PreviewToolbar return statement after state check.");
    }

    const helperBlock = `  function openPublishReadinessFromDropdown() {
    // Opens deeper publish diagnostics from the dropdown.
    setIsPublishMenuOpen(false);
    setWorkspaceView("publish-readiness");
  }

`;

    updated =
      updated.slice(0, returnMatch.index) +
      helperBlock +
      updated.slice(returnMatch.index);

    console.log("Added openPublishReadinessFromDropdown helper.");
  }

  return updated;
}

function findMatchingButtonEnd(section, buttonStart) {
  const close = "</button>";
  const end = section.indexOf(close, buttonStart);

  if (end === -1) return -1;

  return end + close.length;
}

function findPublishButtonRange(section) {
  const matches = [...section.matchAll(/<button[\s\S]*?className=["']publish-button["'][\s\S]*?>/g)];

  if (matches.length === 0) {
    return null;
  }

  // Use the last publish-button inside PreviewToolbar. The earlier one may be inside the dropdown component elsewhere.
  const match = matches[matches.length - 1];

  if (typeof match.index !== "number") {
    return null;
  }

  const buttonStart = match.index;
  const buttonEnd = findMatchingButtonEnd(section, buttonStart);

  if (buttonEnd === -1) {
    return null;
  }

  let replaceStart = buttonStart;
  let replaceEnd = buttonEnd;

  const possibleWrapperStart = section.lastIndexOf("<div", buttonStart);
  const possibleWrapperEnd = section.indexOf("</div>", buttonEnd);

  if (possibleWrapperStart !== -1 && possibleWrapperEnd !== -1) {
    const possibleWrapper = section.slice(
      possibleWrapperStart,
      possibleWrapperEnd + "</div>".length
    );

    if (
      possibleWrapper.includes("publishMenuRef") ||
      possibleWrapper.includes("PublishDropdownPopover") ||
      possibleWrapper.includes("isPublishMenuOpen")
    ) {
      replaceStart = possibleWrapperStart;
      replaceEnd = possibleWrapperEnd + "</div>".length;
    }
  }

  return {
    start: replaceStart,
    end: replaceEnd,
  };
}

function patchPreviewToolbar() {
  const range = findFunctionRange("PreviewToolbar");

  if (!range) {
    fail("Could not find function PreviewToolbar().");
  }

  let section = range.text;

  section = ensureDropdownState(section);

  const publishRange = findPublishButtonRange(section);

  if (!publishRange) {
    fail('Could not find a button with className="publish-button" inside PreviewToolbar.');
  }

  const newPublishBlock = `<div
        ref={publishMenuRef}
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button suppressHydrationWarning
          type="button"
          className="publish-button"
          data-state={isPublishMenuOpen ? "open" : "closed"}
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

  section =
    section.slice(0, publishRange.start) +
    newPublishBlock +
    section.slice(publishRange.end);

  source =
    source.slice(0, range.start) +
    section +
    source.slice(range.end);

  console.log("Replaced PreviewToolbar publish button with dropdown wrapper.");
}

function patchDropdownPosition() {
  const range = findFunctionRange("PublishDropdownPopover");

  if (!range) {
    console.log("PublishDropdownPopover not found. Dropdown component is missing.");
    return;
  }

  let section = range.text;

  section = section
    .split(`position: "absolute",`)
    .join(`position: "fixed",`);

  section = section
    .split(`top: "calc(100% + 10px)",`)
    .join(`top: "58px",`);

  section = section
    .split(`right: 0,`)
    .join(`right: "18px",`);

  section = section
    .split(`zIndex: 80,`)
    .join(`zIndex: 9999,`);

  section = section
    .split(`zIndex: 100,`)
    .join(`zIndex: 9999,`);

  source =
    source.slice(0, range.start) +
    section +
    source.slice(range.end);

  console.log("Forced PublishDropdownPopover fixed positioning.");
}

function addButtonAnimationCss() {
  if (!fs.existsSync(cssPath)) {
    console.log("app/globals.css not found. Skipping CSS animation.");
    return;
  }

  let css = fs.readFileSync(cssPath, "utf8");

  if (css.includes("Founder AI button press feedback")) {
    console.log("Button animation CSS already exists.");
    return;
  }

  css += `

/* Founder AI button press feedback */
button,
.publish-button,
.pill-button,
.tool-button,
.visual-button {
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

button:active:not(:disabled),
.publish-button:active:not(:disabled),
.pill-button:active:not(:disabled),
.tool-button:active:not(:disabled),
.visual-button:active:not(:disabled) {
  transform: translateY(1px) scale(0.985);
}

.publish-button[data-state="open"] {
  transform: translateY(1px) scale(0.985);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24);
}

@media (prefers-reduced-motion: reduce) {
  button,
  .publish-button,
  .pill-button,
  .tool-button,
  .visual-button {
    transition: none;
  }

  button:active:not(:disabled),
  .publish-button:active:not(:disabled),
  .pill-button:active:not(:disabled),
  .tool-button:active:not(:disabled),
  .visual-button:active:not(:disabled),
  .publish-button[data-state="open"] {
    transform: none;
  }
}
`;

  fs.writeFileSync(cssPath, css);
  console.log("Added button animation CSS.");
}

patchPreviewToolbar();
patchDropdownPosition();
addButtonAnimationCss();

save();

console.log("");
console.log("✅ Final Publish dropdown button repair complete.");
console.log(`Backup created at: ${backupPath}`);