import fs from "node:fs";
import path from "node:path";

/**
 * Robustly wires PublishDropdownStatusCard into PublishDropdownPopover.
 *
 * Previous version added the helper but failed to replace the status JSX because
 * the exact formatting had changed. This version:
 * - keeps/adds the helper component
 * - finds the first status card inside PublishDropdownPopover
 * - replaces everything from that card start up to the Website URL card
 *
 * Less brittle. Fewer compiler tantrums. Everyone wins, except chaos.
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-robust-publish-status-card-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");
fs.writeFileSync(backupPath, source);

function fail(message) {
  throw new Error(message);
}

const dropdownMarker = "function PublishDropdownPopover({";
const toolbarMarker = "function PreviewToolbar({";

let dropdownStart = source.indexOf(dropdownMarker);
let toolbarStart = source.indexOf(toolbarMarker, dropdownStart);

if (dropdownStart === -1) {
  fail("Could not find function PublishDropdownPopover.");
}

if (toolbarStart === -1) {
  fail("Could not find function PreviewToolbar after PublishDropdownPopover.");
}

/**
 * 1. Add helper component if missing.
 */
if (!source.includes("function PublishDropdownStatusCard({")) {
  const helper = `function PublishDropdownStatusCard({
  tone,
  publishStageLabel,
  gateLabel,
  hasPublishedSnapshot,
  publishVersion,
  lastPublishedLabel,
  deploymentTimeline,
  deploymentStage,
  deploymentStageIndex,
}: {
  tone: {
    background: string;
    border: string;
    badgeBackground: string;
    badgeColor: string;
  };
  publishStageLabel: string;
  gateLabel: string;
  hasPublishedSnapshot: boolean;
  publishVersion: number;
  lastPublishedLabel: string;
  deploymentTimeline: readonly {
    id: string;
    label: string;
    detail: string;
  }[];
  deploymentStage: string;
  deploymentStageIndex: number;
}) {
  // Top status card for the compact Publish dropdown.
  // Shows gate score, publish version, and a slim deployment timeline.
  return (
    <div
      style={{
        border: \`1px solid \${tone.border}\`,
        background: tone.background,
        borderRadius: "17px",
        padding: "12px",
        display: "grid",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "5px",
            }}
          >
            Status
          </div>

          <div
            style={{
              color: "#111827",
              fontSize: "14px",
              fontWeight: 850,
              lineHeight: 1.25,
            }}
          >
            {gateLabel}
          </div>

          <div
            style={{
              color: "#4b5563",
              fontSize: "12px",
              lineHeight: 1.35,
              marginTop: "4px",
            }}
          >
            Published:{" "}
            {hasPublishedSnapshot
              ? \`v\${publishVersion} · \${lastPublishedLabel}\`
              : "Never"}
          </div>
        </div>

        <div
          style={{
            alignSelf: "flex-start",
            borderRadius: "999px",
            background: tone.badgeBackground,
            color: tone.badgeColor,
            fontSize: "12px",
            fontWeight: 850,
            padding: "7px 11px",
            whiteSpace: "nowrap",
          }}
        >
          {publishStageLabel}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "6px",
          alignItems: "center",
        }}
      >
        {deploymentTimeline.map((item, index) => {
          const isCurrent = item.id === deploymentStage;
          const isComplete = index < deploymentStageIndex;

          return (
            <div
              key={item.id}
              title={item.detail}
              style={{
                display: "grid",
                gap: "5px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  height: "5px",
                  borderRadius: "999px",
                  background: isCurrent
                    ? "#2563eb"
                    : isComplete
                      ? "#16a34a"
                      : "rgba(148, 163, 184, 0.45)",
                }}
              />
              <div
                style={{
                  color: isCurrent ? "#111827" : "#6b7280",
                  fontSize: "10px",
                  fontWeight: isCurrent ? 900 : 750,
                  lineHeight: 1.1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

`;

  source = source.slice(0, dropdownStart) + helper + source.slice(dropdownStart);
  console.log("Added PublishDropdownStatusCard component.");
} else {
  console.log("PublishDropdownStatusCard already exists.");
}

/**
 * 2. Recalculate after optional insert.
 */
dropdownStart = source.indexOf(dropdownMarker);
toolbarStart = source.indexOf(toolbarMarker, dropdownStart);

if (dropdownStart === -1 || toolbarStart === -1) {
  fail("Could not recalculate PublishDropdownPopover section.");
}

let section = source.slice(dropdownStart, toolbarStart);

if (section.includes("<PublishDropdownStatusCard")) {
  console.log("PublishDropdownStatusCard already wired inside PublishDropdownPopover.");
  fs.writeFileSync(pagePath, source);
  console.log("");
  console.log("✅ No replacement needed.");
  console.log(`Backup created at: ${backupPath}`);
  process.exit(0);
}

/**
 * 3. Find the dropdown body content area.
 */
const bodyMarker = `<div style={{ padding: "14px 16px 16px", display: "grid", gap: "12px" }}>`;
const bodyIndex = section.indexOf(bodyMarker);

if (bodyIndex === -1) {
  fail("Could not find Publish dropdown body marker.");
}

/**
 * 4. Find the Website URL card. The top status card is before it.
 */
const websiteLabelIndex = section.indexOf(`Website URL`, bodyIndex);

if (websiteLabelIndex === -1) {
  fail("Could not find Website URL label inside PublishDropdownPopover.");
}

/**
 * 5. Find the first card after the dropdown body marker.
 */
const statusCardStart = section.indexOf(`<div`, bodyIndex + bodyMarker.length);

if (statusCardStart === -1 || statusCardStart > websiteLabelIndex) {
  fail("Could not find top status card before Website URL.");
}

/**
 * 6. Walk JSX-ish divs from statusCardStart until the matching closing div.
 * This is intentionally scoped to the local section. Not a full parser,
 * just less helpless than exact string matching.
 */
function findMatchingDivEnd(text, divStart) {
  const openTag = "<div";
  const closeTag = "</div>";
  let index = divStart;
  let depth = 0;

  while (index < text.length) {
    const nextOpen = text.indexOf(openTag, index);
    const nextClose = text.indexOf(closeTag, index);

    if (nextClose === -1) {
      return -1;
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + openTag.length;
      continue;
    }

    depth -= 1;
    index = nextClose + closeTag.length;

    if (depth === 0) {
      return index;
    }
  }

  return -1;
}

const statusCardEnd = findMatchingDivEnd(section, statusCardStart);

if (statusCardEnd === -1 || statusCardEnd > websiteLabelIndex + 500) {
  fail("Could not safely find end of top status card.");
}

const newStatusCardBlock = `<PublishDropdownStatusCard
          tone={tone}
          publishStageLabel={publishStage.label}
          gateLabel={
            gateReport ? \`\${gateReport.label} · \${gateReport.score}%\` : "Draft · 0%"
          }
          hasPublishedSnapshot={hasPublishedSnapshot}
          publishVersion={publishVersion}
          lastPublishedLabel={lastPublishedLabel}
          deploymentTimeline={deploymentTimeline}
          deploymentStage={deploymentStage}
          deploymentStageIndex={deploymentStageIndex}
        />`;

section =
  section.slice(0, statusCardStart) +
  newStatusCardBlock +
  section.slice(statusCardEnd);

source =
  source.slice(0, dropdownStart) +
  section +
  source.slice(toolbarStart);

fs.writeFileSync(pagePath, source);

console.log("");
console.log("✅ Wired PublishDropdownStatusCard into PublishDropdownPopover.");
console.log(`Backup created at: ${backupPath}`);