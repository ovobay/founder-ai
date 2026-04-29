import fs from "node:fs";
import path from "node:path";

/**
 * Repairs Publish Center ref wiring.
 *
 * The previous script already added:
 * - publishCenterRef
 * - openPublishCenter()
 *
 * It failed because the actual <PublishReadinessWorkspace ... /> render shape
 * did not match the expected JSX.
 *
 * This script:
 * - Finds the real PublishReadinessWorkspace JSX block
 * - Adds publishCenterRef={publishCenterRef}
 * - Ensures PublishReadinessWorkspace accepts the prop
 * - Adds ref={publishCenterRef} to the PublishCenterPanel wrapper
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-repair-publish-center-ref-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. We are repairing a previous patch, because software enjoys sequels.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function findJsxElementRange(tagName) {
  const start = source.indexOf(`<${tagName}`);

  if (start === -1) return null;

  const selfClosingEnd = source.indexOf("/>", start);
  const openEnd = source.indexOf(">", start);

  if (openEnd === -1) return null;

  if (selfClosingEnd !== -1 && selfClosingEnd < openEnd + 5) {
    return {
      start,
      end: selfClosingEnd + 2,
      text: source.slice(start, selfClosingEnd + 2),
    };
  }

  const closeTag = `</${tagName}>`;
  const closeStart = source.indexOf(closeTag, openEnd);

  if (closeStart === -1) return null;

  return {
    start,
    end: closeStart + closeTag.length,
    text: source.slice(start, closeStart + closeTag.length),
  };
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
 * 1. Add publishCenterRef prop to the real PublishReadinessWorkspace render.
 */
if (!source.includes("publishCenterRef={publishCenterRef}")) {
  const range = findJsxElementRange("PublishReadinessWorkspace");

  if (!range) {
    die("Could not find <PublishReadinessWorkspace ... /> render.");
  }

  let patchedElement = range.text;

  if (patchedElement.includes("/>")) {
    patchedElement = patchedElement.replace(
      "/>",
      "  publishCenterRef={publishCenterRef}\n        />"
    );
  } else {
    patchedElement = patchedElement.replace(
      ">",
      "\n          publishCenterRef={publishCenterRef}\n        >"
    );
  }

  source =
    source.slice(0, range.start) +
    patchedElement +
    source.slice(range.end);

  console.log("Added publishCenterRef to PublishReadinessWorkspace render.");
} else {
  console.log("PublishReadinessWorkspace render already has publishCenterRef.");
}

/**
 * 2. Update PublishReadinessWorkspace function props.
 */
updateBetween(
  "PublishReadinessWorkspace",
  "function PublishReadinessWorkspace({",
  "function PublishReadinessCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("publishCenterRef,")) {
      updated = updated.replace(
        "function PublishReadinessWorkspace({",
        "function PublishReadinessWorkspace({"
      );

      const destructureEnd = updated.indexOf("}: {");

      if (destructureEnd === -1) {
        die("Could not find PublishReadinessWorkspace props destructuring.");
      }

      const destructurePart = updated.slice(0, destructureEnd);

      if (!destructurePart.includes("publishCenterRef")) {
        updated =
          updated.slice(0, destructureEnd) +
          "  publishCenterRef,\n" +
          updated.slice(destructureEnd);

        console.log("Added publishCenterRef to destructured props.");
      }
    } else {
      console.log("publishCenterRef already exists in destructured props.");
    }

    if (!updated.includes("publishCenterRef?: React.RefObject<HTMLDivElement | null>;")) {
      const typeBlockIndex = updated.indexOf("}: {");

      if (typeBlockIndex === -1) {
        die("Could not find PublishReadinessWorkspace prop type block.");
      }

      const closingTypeIndex = updated.indexOf("}) {", typeBlockIndex);

      if (closingTypeIndex === -1) {
        die("Could not find end of PublishReadinessWorkspace prop type block.");
      }

      updated =
        updated.slice(0, closingTypeIndex) +
        "  publishCenterRef?: React.RefObject<HTMLDivElement | null>;\n" +
        updated.slice(closingTypeIndex);

      console.log("Added publishCenterRef to prop types.");
    } else {
      console.log("publishCenterRef prop type already exists.");
    }

    /**
     * 3. Add ref to the wrapper around PublishCenterPanel.
     */
    if (!updated.includes("ref={publishCenterRef}")) {
      const marker = `      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishCenterPanel`;

      if (updated.includes(marker)) {
        updated = updated.replace(
          marker,
          `      <div
        ref={publishCenterRef}
        style={{
          marginBottom: "18px",
          scrollMarginTop: "96px",
        }}
      >
        <PublishCenterPanel`
        );

        console.log("Added ref to PublishCenterPanel wrapper.");
      } else {
        console.log("Could not find PublishCenterPanel wrapper marker. Trying looser patch.");

        updated = updated.replace(
          `<PublishCenterPanel`,
          `<div ref={publishCenterRef} style={{ marginBottom: "18px", scrollMarginTop: "96px" }}>
        <PublishCenterPanel`
        );

        updated = updated.replace(
          `        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishGatePanel`,
          `        />
      </div>

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <PublishGatePanel`
        );

        if (updated.includes("ref={publishCenterRef}")) {
          console.log("Added ref using loose patch.");
        } else {
          console.log("PublishCenterPanel ref not added. Manual inspection may be needed.");
        }
      }
    } else {
      console.log("PublishCenterPanel wrapper already has ref.");
    }

    return updated;
  }
);

save();

console.log("");
console.log("✅ Publish Center ref wiring repaired.");
console.log(`Backup created at: ${backupPath}`);