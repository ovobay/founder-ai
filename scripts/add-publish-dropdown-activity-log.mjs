import fs from "node:fs";
import path from "node:path";

/**
 * Adds a compact activity log to PublishDropdownPopover.
 *
 * The log shows recent publish actions directly inside the dropdown:
 * - URL copied
 * - visibility changed
 * - snapshot updated
 * - readiness opened
 *
 * This makes the publish dropdown feel alive and accountable instead of being
 * another lifeless settings rectangle pretending it has purpose.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-publish-dropdown-activity-log-${Date.now()}.tsx`
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

const range = findFunctionRange("PublishDropdownPopover");

if (!range) {
  fail("Could not find function PublishDropdownPopover().");
}

let section = range.text;

/**
 * 1. Add activity log state and helper.
 */
if (!section.includes("const [publishActivityLog, setPublishActivityLog]")) {
  section = section.replace(
    `  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");`,
    `  const [message, setMessage] = useState("");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not updated yet");
  const [publishActivityLog, setPublishActivityLog] = useState<string[]>([
    "Publish menu opened.",
  ]);

  function addPublishActivityLogItem(item: string) {
    // Keep the latest publish activity visible without turning the dropdown into a novel.
    setPublishActivityLog((current) => [item, ...current].slice(0, 4));
  }`
  );

  console.log("Added publish activity log state.");
} else {
  console.log("Publish activity log state already exists.");
}

/**
 * 2. Log URL copy result.
 */
section = section.replace(
  `      await navigator.clipboard.writeText(activeUrl);
      setMessage("Website URL copied.");`,
  `      await navigator.clipboard.writeText(activeUrl);
      setMessage("Website URL copied.");
      addPublishActivityLogItem("Copied website URL.");`
);

section = section.replace(
  `      setMessage("Could not copy URL. Copy it manually.");`,
  `      setMessage("Could not copy URL. Copy it manually.");
      addPublishActivityLogItem("URL copy failed.");`
);

/**
 * 3. Log snapshot update outcomes.
 */
section = section.replace(
  `      setMessage("No generated files yet. Build something first.");
      return;`,
  `      setMessage("No generated files yet. Build something first.");
      addPublishActivityLogItem("Snapshot update blocked: no generated files.");
      return;`
);

section = section.replace(
  `      setMessage("Snapshot updated. Publishing is still blocked.");
      return;`,
  `      setMessage("Snapshot updated. Publishing is still blocked.");
      addPublishActivityLogItem("Updated blocked publish snapshot.");
      return;`
);

section = section.replace(
  `      setMessage("Preview snapshot updated. Review before staging.");
      return;`,
  `      setMessage("Preview snapshot updated. Review before staging.");
      addPublishActivityLogItem("Updated preview snapshot.");
      return;`
);

section = section.replace(
  `      setMessage("Staging snapshot updated. Run tests before production.");
      return;`,
  `      setMessage("Staging snapshot updated. Run tests before production.");
      addPublishActivityLogItem("Updated staging snapshot.");
      return;`
);

section = section.replace(
  `    setMessage("Publish snapshot updated. Final manual review still required.");`,
  `    setMessage("Publish snapshot updated. Final manual review still required.");
    addPublishActivityLogItem("Updated publish snapshot.");`
);

/**
 * 4. Log full readiness opening.
 */
section = section.replace(
  `    onOpenReadiness();
    onClose();`,
  `    addPublishActivityLogItem("Opened full publish readiness.");
    onOpenReadiness();
    onClose();`
);

/**
 * 5. Log visibility changes.
 */
section = section.replace(
  `onClick={() => setVisibility(option)}`,
  `onClick={() => {
                  setVisibility(option);
                  addPublishActivityLogItem(
                    \`Visibility changed to \${option}.\`
                  );
                }}`
);

/**
 * 6. Add activity log UI before the message paragraph.
 */
if (!section.includes("Recent publish activity")) {
  section = section.replace(
    `        {message ? (
          <p`,
    `        <div
          style={{
            borderTop: "1px solid #eef0f3",
            paddingTop: "10px",
            display: "grid",
            gap: "6px",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Recent publish activity
          </div>

          {publishActivityLog.map((item) => (
            <div
              key={item}
              style={{
                color: "#374151",
                fontSize: "12px",
                lineHeight: 1.35,
              }}
            >
              • {item}
            </div>
          ))}
        </div>

        {message ? (
          <p`
  );

  console.log("Added publish activity log UI.");
} else {
  console.log("Publish activity log UI already exists.");
}

source = source.slice(0, range.start) + section + source.slice(range.end);

save();

console.log("");
console.log("✅ Publish dropdown activity log added.");
console.log(`Backup created at: ${backupPath}`);