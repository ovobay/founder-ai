import fs from "node:fs";
import path from "node:path";

/**
 * Adds a calmer background-working build experience to app/page.tsx.
 *
 * While a build is running:
 * - show one compact "Working in background" card
 * - show current phase and progress
 * - hide long module/checklist details until completion
 *
 * After completion:
 * - show the normal detailed build summary
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-background-working-mode-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Backup first. Because editing app/page.tsx without a backup is how keyboards learn fear.
fs.writeFileSync(backupPath, source);

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function insertBefore(label, marker, insertion) {
  if (source.includes(insertion.trim())) {
    console.log(`Skipping ${label}: already exists.`);
    return;
  }

  if (!source.includes(marker)) {
    die(`Missing marker for ${label}`);
  }

  source = source.replace(marker, `${insertion}${marker}`);
}

/**
 * Finds the full text range of a function declaration by scanning braces.
 * This avoids fragile regex disasters. Tiny mercy.
 */
function findFunctionRange(functionName) {
  const functionStart = source.indexOf(`function ${functionName}(`);

  if (functionStart === -1) {
    return null;
  }

  const bodyStart = source.indexOf("{", functionStart);

  if (bodyStart === -1) {
    return null;
  }

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

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start: functionStart,
          end: index + 1,
        };
      }
    }
  }

  return null;
}

/**
 * 1. Add helper functions and the compact working card.
 */
const backgroundWorkingHelpers = `function isAssistantBuildWorking(item: FeedItem) {
  // A build card is considered "working" when it belongs to the assistant and is not completed yet.
  return item.role === "assistant" && item.status !== "completed";
}

function getBackgroundBuildPhase(item: FeedItem) {
  // Use the last active/incomplete step as the visible current phase.
  const activeStep =
    item.steps?.find((step) => step.status === "active") ??
    [...(item.steps ?? [])].reverse().find((step) => step.status !== "complete");

  if (activeStep) return activeStep.label;

  if (item.status === "building") return "Building project";
  if (item.status === "thinking") return "Planning build";
  if (item.status === "queued") return "Queued";

  return "Working";
}

function getBackgroundBuildProgress(item: FeedItem) {
  // Calculate a rough progress percentage from completed build steps.
  const steps = item.steps ?? [];

  if (steps.length === 0) return 12;

  const completeCount = steps.filter((step) => step.status === "complete").length;
  const progress = Math.round((completeCount / steps.length) * 100);

  return Math.max(12, Math.min(progress, 92));
}

function BackgroundWorkingCard({
  item,
}: {
  item: FeedItem;
}) {
  const progress = getBackgroundBuildProgress(item);
  const phase = getBackgroundBuildPhase(item);

  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(250,247,241,0.94))",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        padding: "18px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-44px",
          top: "-44px",
          width: "140px",
          height: "140px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(37, 99, 235, 0.16), rgba(37, 99, 235, 0))",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "14px",
          position: "relative",
        }}
      >
        <div>
          <div
            style={{
              color: "#2563eb",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Working in background
          </div>

          <h3
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "18px",
              lineHeight: 1.2,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            {item.title || "Building your project"}
          </h3>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "28px",
            padding: "0 11px",
            borderRadius: "999px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          Running
        </span>
      </div>

      <p
        style={{
          margin: "0 0 14px",
          color: "#4b5563",
          fontSize: "14px",
          lineHeight: 1.55,
          position: "relative",
        }}
      >
        Founder AI is planning, generating, and checking the build. Details will
        appear when the run is complete.
      </p>

      <div
        style={{
          border: "1px solid #eef0f3",
          borderRadius: "16px",
          background: "#ffffff",
          padding: "13px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <strong
            style={{
              color: "#111827",
              fontSize: "13px",
              lineHeight: 1.35,
            }}
          >
            {phase}
          </strong>

          <span
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {progress}%
          </span>
        </div>

        <div
          style={{
            height: "8px",
            borderRadius: "999px",
            background: "#eef2ff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: \`\${progress}%\`,
              height: "100%",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(37,99,235,0.85), rgba(124,58,237,0.85))",
              transition: "width 260ms ease",
            }}
          />
        </div>
      </div>
    </article>
  );
}

`;

if (!source.includes("function BackgroundWorkingCard(")) {
  if (source.includes("function BuildUpdateCard(")) {
    insertBefore(
      "background working helpers",
      "function BuildUpdateCard(",
      backgroundWorkingHelpers
    );
  } else if (source.includes("function FeedItemCard(")) {
    insertBefore(
      "background working helpers",
      "function FeedItemCard(",
      backgroundWorkingHelpers
    );
  } else if (source.includes("function ActivityFeedItem(")) {
    insertBefore(
      "background working helpers",
      "function ActivityFeedItem(",
      backgroundWorkingHelpers
    );
  } else if (source.includes("function PreviewContent(")) {
    insertBefore(
      "background working helpers",
      "function PreviewContent(",
      backgroundWorkingHelpers
    );
  } else {
    die("Could not find a safe place to insert BackgroundWorkingCard.");
  }

  console.log("Added BackgroundWorkingCard helpers/component.");
} else {
  console.log("BackgroundWorkingCard already exists.");
}

/**
 * 2. Patch the feed card component so running assistant items show the compact card.
 */
const cardFunctionNames = [
  "BuildUpdateCard",
  "FeedItemCard",
  "ActivityFeedItem",
  "AssistantUpdateCard",
  "ActivityCard",
  "FeedCard",
];

let patchedCard = false;

for (const functionName of cardFunctionNames) {
  const range = findFunctionRange(functionName);

  if (!range) {
    continue;
  }

  const before = source.slice(0, range.start);
  let section = source.slice(range.start, range.end);
  const after = source.slice(range.end);

  if (section.includes("<BackgroundWorkingCard item={item} />")) {
    console.log(`${functionName} already uses BackgroundWorkingCard.`);
    patchedCard = true;
    break;
  }

  if (!section.includes("item")) {
    console.log(`${functionName} found but no item reference. Skipping.`);
    continue;
  }

  const firstReturnIndex = section.indexOf("return (");

  if (firstReturnIndex === -1) {
    console.log(`${functionName} has no obvious return block. Skipping.`);
    continue;
  }

  const guard = `
  if (isAssistantBuildWorking(item)) {
    return <BackgroundWorkingCard item={item} />;
  }

`;

  section =
    section.slice(0, firstReturnIndex) +
    guard +
    section.slice(firstReturnIndex);

  source = before + section + after;
  console.log(`Patched ${functionName} to show compact background working card.`);
  patchedCard = true;
  break;
}

/**
 * 3. If no component was patched, report the useful grep command.
 */
if (!patchedCard) {
  console.log("");
  console.log("⚠️ Could not automatically patch the feed card renderer.");
  console.log("The BackgroundWorkingCard component was added, but the feed renderer needs a manual hook.");
  console.log("Run this command and paste the output:");
  console.log("");
  console.log(
    `grep -n "feedItems.map\\|activityItems.map\\|BuildUpdateCard\\|FeedItemCard\\|ActivityFeedItem\\|AssistantUpdateCard\\|FeedCard" app/page.tsx`
  );
}

save();

console.log("");
console.log("✅ Background working mode patch complete.");
console.log(`Backup created at: ${backupPath}`);