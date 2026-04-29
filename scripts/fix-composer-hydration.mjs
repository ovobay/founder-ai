import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-composer-hydration-fix-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
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
 * Fix Composer hydration mismatch.
 * Problem: disabled can resolve as true on SSR and null/undefined on client.
 * Solution: force a stable boolean and use that everywhere in Composer.
 */
updateBetween(
  "Composer",
  "function Composer({",
  "function PreviewToolbar({",
  (section) => {
    let updated = section;

    if (!updated.includes("const composerDisabled = Boolean(")) {
      updated = updated.replace(
        `  const [menuOpen, setMenuOpen] = useState(false);

  return (`,
        `  const [menuOpen, setMenuOpen] = useState(false);
  const composerDisabled = Boolean(isBuilding || isLoadingWorkspace);

  return (`
      );

      console.log("Added stable composerDisabled boolean.");
    } else {
      console.log("composerDisabled already exists.");
    }

    updated = updated.replaceAll(
      "disabled={isBuilding || isLoadingWorkspace}",
      "disabled={composerDisabled}"
    );

    updated = updated.replaceAll(
      "disabled={isBuilding || isLoadingWorkspace ? true : null}",
      "disabled={composerDisabled}"
    );

    updated = updated.replaceAll(
      "disabled={isBuilding || isLoadingWorkspace ? true : undefined}",
      "disabled={composerDisabled}"
    );

    updated = updated.replaceAll(
      "disabled={isBuilding ? true : null}",
      "disabled={Boolean(isBuilding)}"
    );

    updated = updated.replaceAll(
      "disabled={isLoadingWorkspace ? true : null}",
      "disabled={Boolean(isLoadingWorkspace)}"
    );

    if (!updated.includes("suppressHydrationWarning")) {
      updated = updated.replace(
        `<textarea
        value={prompt}`,
        `<textarea
        suppressHydrationWarning
        value={prompt}`
      );

      console.log("Added suppressHydrationWarning to composer textarea.");
    } else {
      console.log("Composer textarea already has suppressHydrationWarning.");
    }

    return updated;
  }
);

save();

console.log("✅ Composer hydration fix applied.");
console.log(`Backup created at: ${backupPath}`);