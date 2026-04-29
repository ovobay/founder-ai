import fs from "node:fs";
import path from "node:path";

/**
 * Adds proper close behaviour to the Publish dropdown.
 *
 * Fixes:
 * - Click outside closes the dropdown.
 * - Escape closes the dropdown.
 * - The Publish button wrapper owns a ref.
 * - The dropdown behaves like a real contextual popover, not a stubborn modal goblin.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-dropdown-close-behaviour-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Dropdowns are small until they ruin your afternoon.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function fail(message) {
  save();
  throw new Error(message);
}

function updateBetween(label, startMarker, endMarker, updater) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    fail(`Could not find section: ${label}`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  source = before + updater(section) + after;
}

/**
 * Patch PreviewToolbar because that is where the Publish button/dropdown lives.
 */
updateBetween(
  "PreviewToolbar",
  "function PreviewToolbar({",
  "function isAssistantBuildWorking(",
  (section) => {
    let updated = section;

    /**
     * 1. Add wrapper ref after dropdown open state.
     */
    if (!updated.includes("const publishMenuRef = useRef<HTMLDivElement | null>(null);")) {
      updated = updated.replace(
        `  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);`,
        `  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const publishMenuRef = useRef<HTMLDivElement | null>(null);`
      );

      console.log("Added publishMenuRef.");
    } else {
      console.log("publishMenuRef already exists.");
    }

    /**
     * 2. Add click-outside and Escape close effect.
     */
    if (!updated.includes("Close Publish dropdown on outside click or Escape.")) {
      const effectCode = `
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

      const marker = `  function openPublishReadinessFromDropdown() {`;

      if (!updated.includes(marker)) {
        fail("Could not find openPublishReadinessFromDropdown marker inside PreviewToolbar.");
      }

      updated = updated.replace(marker, `${effectCode}${marker}`);
      console.log("Added close behaviour effect.");
    } else {
      console.log("Close behaviour effect already exists.");
    }

    /**
     * 3. Add ref to the Publish dropdown wrapper.
     */
    if (!updated.includes("ref={publishMenuRef}")) {
      updated = updated.replace(
        `      <div
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >`,
        `      <div
        ref={publishMenuRef}
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >`
      );

      console.log("Added ref to Publish dropdown wrapper.");
    } else {
      console.log("Publish dropdown wrapper already has ref.");
    }

    /**
     * 4. Make readiness opener close the menu first.
     */
    updated = updated.replace(
      `  function openPublishReadinessFromDropdown() {
    // Opens deeper publish diagnostics from the dropdown.
    setWorkspaceView("publish-readiness");
  }`,
      `  function openPublishReadinessFromDropdown() {
    // Opens deeper publish diagnostics from the dropdown.
    setIsPublishMenuOpen(false);
    setWorkspaceView("publish-readiness");
  }`
    );

    return updated;
  }
);

save();

console.log("");
console.log("✅ Publish dropdown close behaviour added.");
console.log(`Backup created at: ${backupPath}`);