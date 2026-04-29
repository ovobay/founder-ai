import fs from "node:fs";
import path from "node:path";

/**
 * Wires the top Publish button to the Publish Center.
 *
 * What this does:
 * - Adds a publish center ref.
 * - Adds openPublishCenter() handler.
 * - Makes the Publish button switch to publish readiness view.
 * - Smooth-scrolls to the Publish Center panel after switching views.
 *
 * This avoids having a pretty Publish button that does nothing,
 * because decorative launch controls belong in museums and bad SaaS demos.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-wire-publish-button-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are wiring a main action, not gambling with a houseplant.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function replaceOnce(label, from, to) {
  if (!source.includes(from)) {
    die(`Could not find block for: ${label}`);
  }

  source = source.replace(from, to);
  console.log(`Patched: ${label}`);
}

function updateBetween(label, startMarker, endMarker, updater) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    die(`Could not find section: ${label}`);
  }

  const before = source.slice(0, start);
  const section = source.slice(start, end);
  const after = source.slice(end);

  source = before + updater(section) + after;
}

/**
 * 1. Add a ref for the Publish Center in the main page component.
 *
 * We try to place it near the existing refs.
 */
if (!source.includes("const publishCenterRef = useRef<HTMLDivElement | null>(null);")) {
  const refCandidates = [
    `  const activityScrollRef = useRef<HTMLDivElement | null>(null);
`,
    `  const activityScrollRef = useRef(null);
`,
    `  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
`,
    `  const inputRef = useRef<HTMLInputElement | null>(null);
`,
  ];

  let addedRef = false;

  for (const candidate of refCandidates) {
    if (source.includes(candidate)) {
      source = source.replace(
        candidate,
        `${candidate}  const publishCenterRef = useRef<HTMLDivElement | null>(null);
`
      );
      addedRef = true;
      console.log("Added publishCenterRef.");
      break;
    }
  }

  if (!addedRef) {
    die("Could not find a safe place to add publishCenterRef.");
  }
} else {
  console.log("publishCenterRef already exists.");
}

/**
 * 2. Add openPublishCenter() in the main page component.
 *
 * It switches the workspace view to publish readiness and scrolls to the panel.
 */
if (!source.includes("function openPublishCenter()")) {
  const insertion = `
  function openPublishCenter() {
    // Open the publish readiness workspace and focus the Publish Center.
    setWorkspaceView("publish-readiness");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        publishCenterRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

`;

  const handlerMarkers = [
    `  async function signOut() {
`,
    `  async function runBuild(
`,
    `  function addBuildHistoryItem(historyItem: BuildHistoryItem) {
`,
  ];

  let insertedHandler = false;

  for (const marker of handlerMarkers) {
    if (source.includes(marker)) {
      source = source.replace(marker, `${insertion}${marker}`);
      insertedHandler = true;
      console.log("Added openPublishCenter handler.");
      break;
    }
  }

  if (!insertedHandler) {
    die("Could not find a safe place to insert openPublishCenter().");
  }
} else {
  console.log("openPublishCenter already exists.");
}

/**
 * 3. Pass publishCenterRef into PublishReadinessWorkspace.
 *
 * First, update the render call.
 */
if (!source.includes("publishCenterRef={publishCenterRef}")) {
  const renderBlocks = [
    {
      label: "PublishReadinessWorkspace render with files",
      from: `<PublishReadinessWorkspace
              previewState={previewState}
              files={changedFiles}
            />`,
      to: `<PublishReadinessWorkspace
              previewState={previewState}
              files={changedFiles}
              publishCenterRef={publishCenterRef}
            />`,
    },
    {
      label: "PublishReadinessWorkspace render with selected files",
      from: `<PublishReadinessWorkspace
          previewState={previewState}
          files={changedFiles}
        />`,
      to: `<PublishReadinessWorkspace
          previewState={previewState}
          files={changedFiles}
          publishCenterRef={publishCenterRef}
        />`,
    },
    {
      label: "PublishReadinessWorkspace compact render",
      from: `<PublishReadinessWorkspace previewState={previewState} files={changedFiles} />`,
      to: `<PublishReadinessWorkspace
          previewState={previewState}
          files={changedFiles}
          publishCenterRef={publishCenterRef}
        />`,
    },
  ];

  let patchedRender = false;

  for (const block of renderBlocks) {
    if (source.includes(block.from)) {
      source = source.replace(block.from, block.to);
      patchedRender = true;
      console.log(`Patched: ${block.label}`);
      break;
    }
  }

  if (!patchedRender) {
    console.log("Could not find exact PublishReadinessWorkspace render. Trying loose replacement.");

    source = source.replace(
      /<PublishReadinessWorkspace\s+previewState=\{previewState\}\s+files=\{changedFiles\}\s*\/>/,
      `<PublishReadinessWorkspace
          previewState={previewState}
          files={changedFiles}
          publishCenterRef={publishCenterRef}
        />`
    );

    if (!source.includes("publishCenterRef={publishCenterRef}")) {
      die("Could not patch PublishReadinessWorkspace render.");
    }

    console.log("Patched PublishReadinessWorkspace render using loose replacement.");
  }
} else {
  console.log("PublishReadinessWorkspace render already receives publishCenterRef.");
}

/**
 * 4. Update PublishReadinessWorkspace props and wrap PublishCenterPanel with the ref.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    /**
     * Update destructured props.
     */
    if (!updated.includes("publishCenterRef")) {
      updated = updated.replace(
        `function PublishReadinessWorkspace({
  previewState,
  files,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
}) {`,
        `function PublishReadinessWorkspace({
  previewState,
  files,
  publishCenterRef,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  publishCenterRef?: React.RefObject<HTMLDivElement | null>;
}) {`
      );

      console.log("Updated PublishReadinessWorkspace props.");
    } else {
      console.log("PublishReadinessWorkspace props already include publishCenterRef.");
    }

    /**
     * Add ref to the wrapper around PublishCenterPanel.
     */
    if (!updated.includes("ref={publishCenterRef}")) {
      updated = updated.replace(
        `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishCenterPanel`,
        `      <div
        ref={publishCenterRef}
        style={{
          marginBottom: "18px",
          scrollMarginTop: "96px",
        }}
      >
        <PublishCenterPanel`
      );

      if (updated.includes("ref={publishCenterRef}")) {
        console.log("Added ref to PublishCenterPanel wrapper.");
      } else {
        console.log("Could not add PublishCenterPanel wrapper ref. PublishCenterPanel may not be rendered yet.");
      }
    } else {
      console.log("PublishCenterPanel wrapper already has ref.");
    }

    return updated;
  }
);

/**
 * 5. Wire the visible top Publish button.
 *
 * We patch common button shapes. If none match, we print grep help.
 */
let wiredPublishButton = false;

const buttonPatches = [
  {
    label: "Publish button with text only",
    from: `<button
            type="button"
            className="primary-button"
          >
            Publish
          </button>`,
    to: `<button
            type="button"
            className="primary-button"
            onClick={openPublishCenter}
          >
            Publish
          </button>`,
  },
  {
    label: "Publish pill button with text only",
    from: `<button
            type="button"
            className="pill-button"
          >
            Publish
          </button>`,
    to: `<button
            type="button"
            className="pill-button"
            onClick={openPublishCenter}
          >
            Publish
          </button>`,
  },
  {
    label: "Publish visual button with text only",
    from: `<button
            type="button"
            className="visual-button"
          >
            Publish
          </button>`,
    to: `<button
            type="button"
            className="visual-button"
            onClick={openPublishCenter}
          >
            Publish
          </button>`,
  },
];

if (!source.includes("onClick={openPublishCenter}")) {
  for (const patch of buttonPatches) {
    if (source.includes(patch.from)) {
      source = source.replace(patch.from, patch.to);
      wiredPublishButton = true;
      console.log(`Patched: ${patch.label}`);
      break;
    }
  }

  /**
   * Fallback: patch the first button block that contains the exact text Publish.
   */
  if (!wiredPublishButton) {
    const publishTextIndex = source.indexOf(">Publish</button>");

    if (publishTextIndex !== -1) {
      const buttonStart = source.lastIndexOf("<button", publishTextIndex);
      const buttonEnd = source.indexOf(">", buttonStart);

      if (buttonStart !== -1 && buttonEnd !== -1) {
        const buttonOpen = source.slice(buttonStart, buttonEnd + 1);

        if (!buttonOpen.includes("onClick=")) {
          const patchedButtonOpen = buttonOpen.replace(
            ">",
            `
            onClick={openPublishCenter}
          >`
          );

          source =
            source.slice(0, buttonStart) +
            patchedButtonOpen +
            source.slice(buttonEnd + 1);

          wiredPublishButton = true;
          console.log("Patched Publish button using fallback.");
        } else {
          console.log("Publish button already has an onClick. Not overwriting automatically.");
        }
      }
    }
  }
} else {
  wiredPublishButton = true;
  console.log("Publish button already wired to openPublishCenter.");
}

if (!wiredPublishButton) {
  console.log("");
  console.log("⚠️ Could not automatically wire the top Publish button.");
  console.log("Run this command and paste the output:");
  console.log("");
  console.log(`grep -n -A 8 -B 8 ">Publish<\\|Publish" app/page.tsx`);
}

save();

console.log("");
console.log("✅ Publish button wiring patch complete.");
console.log(`Backup created at: ${backupPath}`);