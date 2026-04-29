import fs from "node:fs";
import path from "node:path";

/**
 * Fixes Publish dropdown behaviour and adds button click animation.
 *
 * Fixes:
 * - Publish button definitely toggles the dropdown.
 * - Dropdown uses fixed positioning so it is not clipped by parent containers.
 * - Dropdown closes with Escape and outside click if the existing close logic is present.
 * - Adds global button press animation to app/globals.css.
 *
 * This is the "stop being decorative and do your job" patch.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const globalsPath = path.join(process.cwd(), "app/globals.css");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-fix-publish-dropdown-animation-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are fixing the toolbar, not conducting performance art.
fs.writeFileSync(backupPath, source);

function savePage() {
  fs.writeFileSync(pagePath, source);
}

function fail(message) {
  savePage();
  throw new Error(message);
}

function findFunctionRange(functionName) {
  const start = source.indexOf(`function ${functionName}(`);

  if (start === -1) return null;

  const bodyStart = source.indexOf("{", start);

  if (bodyStart === -1) return null;

  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let inTemplate = false;
  let escaped = false;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === stringQuote) {
        inString = false;
        stringQuote = "";
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`") {
        inTemplate = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const lineEnd = source.indexOf("\n", index);
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (char === "/" && nextChar === "*") {
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

function patchPreviewToolbarRenderProps() {
  const toolbarStart = source.indexOf("<PreviewToolbar");

  if (toolbarStart === -1) {
    console.log("Could not find <PreviewToolbar render. Skipping render props.");
    return;
  }

  const toolbarEnd = source.indexOf("/>", toolbarStart);

  if (toolbarEnd === -1) {
    console.log("Could not find end of <PreviewToolbar render. Skipping render props.");
    return;
  }

  const toolbarBlock = source.slice(toolbarStart, toolbarEnd + 2);
  let patched = toolbarBlock;

  if (!patched.includes("previewState={previewState}")) {
    patched = patched.replace(
      "/>",
      "  previewState={previewState}\n            />"
    );
    console.log("Added previewState to PreviewToolbar render.");
  }

  if (!patched.includes("files={changedFiles}")) {
    patched = patched.replace(
      "/>",
      "  files={changedFiles}\n            />"
    );
    console.log("Added files to PreviewToolbar render.");
  }

  if (patched !== toolbarBlock) {
    source = source.slice(0, toolbarStart) + patched + source.slice(toolbarEnd + 2);
  }
}

function patchPreviewToolbarFunction() {
  const range = findFunctionRange("PreviewToolbar");

  if (!range) {
    fail("Could not find function PreviewToolbar().");
  }

  let section = range.text;

  /**
   * Add previewState/files to destructured props if missing.
   */
  const propsTypeMarker = section.indexOf("}: {");

  if (propsTypeMarker === -1) {
    fail("Could not find PreviewToolbar props marker `}: {`.");
  }

  const destructuredProps = section.slice(0, propsTypeMarker);

  if (!destructuredProps.includes("previewState")) {
    section =
      section.slice(0, propsTypeMarker) +
      "  previewState,\n" +
      section.slice(propsTypeMarker);
    console.log("Added previewState to PreviewToolbar destructured props.");
  }

  const propsTypeMarkerAfterPreview = section.indexOf("}: {");
  const destructuredPropsAfterPreview = section.slice(0, propsTypeMarkerAfterPreview);

  if (!destructuredPropsAfterPreview.includes("files,")) {
    section =
      section.slice(0, propsTypeMarkerAfterPreview) +
      "  files,\n" +
      section.slice(propsTypeMarkerAfterPreview);
    console.log("Added files to PreviewToolbar destructured props.");
  }

  /**
   * Add previewState/files to prop types if missing.
   */
  const propsEnd = section.indexOf("}) {");

  if (propsEnd === -1) {
    fail("Could not find PreviewToolbar props ending `}) {`.");
  }

  const propTypes = section.slice(0, propsEnd);

  if (!propTypes.includes("previewState?: PreviewState;")) {
    section =
      section.slice(0, propsEnd) +
      "  previewState?: PreviewState;\n" +
      section.slice(propsEnd);
    console.log("Added previewState prop type to PreviewToolbar.");
  }

  const latestPropsEnd = section.indexOf("}) {");
  const latestPropTypes = section.slice(0, latestPropsEnd);

  if (!latestPropTypes.includes("files?: ChangedFile[];")) {
    section =
      section.slice(0, latestPropsEnd) +
      "  files?: ChangedFile[];\n" +
      section.slice(latestPropsEnd);
    console.log("Added files prop type to PreviewToolbar.");
  }

  /**
   * Add dropdown open state if missing.
   */
  if (!section.includes("const [isPublishMenuOpen, setIsPublishMenuOpen]")) {
    const returnMarker = "  return (";

    if (!section.includes(returnMarker)) {
      fail("Could not find PreviewToolbar return marker.");
    }

    section = section.replace(
      returnMarker,
      `  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
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

${returnMarker}`
    );

    console.log("Added publish dropdown state/effects to PreviewToolbar.");
  }

  /**
   * Remove any existing inline PublishDropdownPopover render near the Publish button.
   * Then rebuild the Publish button block cleanly.
   */
  const publishTextIndex = section.indexOf(">Publish</button>");

  if (publishTextIndex === -1) {
    fail("Could not find Publish button inside PreviewToolbar.");
  }

  const buttonStart = section.lastIndexOf("<button", publishTextIndex);
  const buttonEnd = section.indexOf("</button>", publishTextIndex) + "</button>".length;

  if (buttonStart === -1 || buttonEnd === -1) {
    fail("Could not isolate Publish button.");
  }

  /**
   * If the button is already wrapped in a publish menu wrapper, try to replace the wrapper.
   * Otherwise replace just the button.
   */
  const wrapperStartCandidate = section.lastIndexOf("<div", buttonStart);
  const wrapperEndCandidate = section.indexOf("</div>", buttonEnd);

  const nearbyWrapper = wrapperStartCandidate !== -1 && wrapperEndCandidate !== -1
    ? section.slice(wrapperStartCandidate, wrapperEndCandidate + "</div>".length)
    : "";

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

  if (
    nearbyWrapper.includes("publish-button") &&
    nearbyWrapper.includes("PublishDropdownPopover")
  ) {
    section =
      section.slice(0, wrapperStartCandidate) +
      newPublishBlock +
      section.slice(wrapperEndCandidate + "</div>".length);

    console.log("Replaced existing Publish dropdown wrapper.");
  } else {
    section =
      section.slice(0, buttonStart) +
      newPublishBlock +
      section.slice(buttonEnd);

    console.log("Replaced Publish button with working dropdown wrapper.");
  }

  source = source.slice(0, range.start) + section + source.slice(range.end);
}

function patchPublishDropdownPosition() {
  const range = findFunctionRange("PublishDropdownPopover");

  if (!range) {
    fail("Could not find function PublishDropdownPopover(). Run the add dropdown script first.");
  }

  let section = range.text;

  /**
   * Make the dropdown fixed so toolbar/page overflow cannot hide it.
   */
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

  source = source.slice(0, range.start) + section + source.slice(range.end);

  console.log("Patched PublishDropdownPopover to fixed positioning.");
}

function patchButtonAnimationCss() {
  if (!fs.existsSync(globalsPath)) {
    console.log("app/globals.css not found. Skipping global button animation CSS.");
    return;
  }

  let css = fs.readFileSync(globalsPath, "utf8");

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

  fs.writeFileSync(globalsPath, css);
  console.log("Added global button click animation CSS.");
}

patchPreviewToolbarRenderProps();
patchPreviewToolbarFunction();
patchPublishDropdownPosition();
patchButtonAnimationCss();

savePage();

console.log("");
console.log("✅ Publish dropdown and button animation fixed.");
console.log(`Backup created at: ${backupPath}`);