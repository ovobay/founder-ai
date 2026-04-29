import fs from "node:fs";
import path from "node:path";

/**
 * This script patches app/page.tsx to add a Build Pack health score.
 *
 * The health score appears inside the Build Pack contents panel and tells the
 * user whether the generated handoff/build files are complete, mostly complete,
 * partial, or missing.
 *
 * It checks these expected files:
 * - config/project-brief.md
 * - config/deploy-checklist.md
 * - config/env.example
 * - supabase/migrations/generated_architecture.sql
 */

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-build-pack-health-${Date.now()}.tsx`
);

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

// Create a backup before modifying the app file, because optimism is not version control.
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
    die(`Missing marker: ${label}`);
  }

  source = source.replace(marker, `${insertion}${marker}`);
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
 * 1. Add BuildPackHealth type.
 *
 * This describes the health summary shown at the top of the Build Pack panel.
 */
const buildPackHealthType = `type BuildPackHealth = {
  status: "complete" | "mostly-complete" | "partial" | "missing";
  label: string;
  score: number;
  summary: string;
  missingFiles: string[];
};

`;

if (!source.includes("type BuildPackHealth = {")) {
  if (source.includes("type BuildPackFileStatus = {")) {
    insertBefore(
      "BuildPackHealth type",
      "type BuildPackFileStatus =",
      buildPackHealthType
    );
  } else if (source.includes("type DeployReadinessItem = {")) {
    insertBefore(
      "BuildPackHealth type",
      "type DeployReadinessItem =",
      buildPackHealthType
    );
  } else {
    insertBefore(
      "BuildPackHealth type",
      "type DetectedModule =",
      buildPackHealthType
    );
  }

  console.log("Added BuildPackHealth type.");
} else {
  console.log("BuildPackHealth type already exists.");
}

/**
 * 2. Add getBuildPackHealth helper.
 *
 * This helper converts the build pack file statuses into a percentage score and
 * a human-readable status.
 */
const buildPackHealthHelper = `function getBuildPackHealth(files: ChangedFile[]): BuildPackHealth {
  const buildPackFiles = getBuildPackFileStatuses(files);
  const totalFiles = buildPackFiles.length;
  const existingFiles = buildPackFiles.filter((file) => file.exists);
  const missingFiles = buildPackFiles
    .filter((file) => !file.exists)
    .map((file) => file.path);

  const score =
    totalFiles > 0 ? Math.round((existingFiles.length / totalFiles) * 100) : 0;

  if (score === 100) {
    return {
      status: "complete",
      label: "Complete",
      score,
      summary:
        "All core build pack files exist. Review them before using them for deployment or handoff.",
      missingFiles,
    };
  }

  if (score >= 75) {
    return {
      status: "mostly-complete",
      label: "Mostly complete",
      score,
      summary:
        "Most build pack files exist, but at least one key file is missing. Export the full build pack to close the gap.",
      missingFiles,
    };
  }

  if (score > 0) {
    return {
      status: "partial",
      label: "Partial",
      score,
      summary:
        "Some build pack files exist, but the handoff is incomplete. Export the full build pack before launch planning.",
      missingFiles,
    };
  }

  return {
    status: "missing",
    label: "Missing",
    score,
    summary:
      "No core build pack files exist yet. Export the full build pack before pretending this is ready for anyone with a pulse.",
    missingFiles,
  };
}

`;

if (!source.includes("function getBuildPackHealth(")) {
  if (source.includes("function getBuildPackFileStatuses(")) {
    insertBefore(
      "getBuildPackHealth helper",
      "function getBuildPackFileStatuses(",
      buildPackHealthHelper
    );
  } else if (source.includes("function getDeployReadinessItems(")) {
    insertBefore(
      "getBuildPackHealth helper",
      "function getDeployReadinessItems(",
      buildPackHealthHelper
    );
  } else {
    insertBefore(
      "getBuildPackHealth helper",
      "function PublishReadinessWorkspace(",
      buildPackHealthHelper
    );
  }

  console.log("Added getBuildPackHealth helper.");
} else {
  console.log("getBuildPackHealth helper already exists.");
}

/**
 * 3. Add BuildPackHealthCard component.
 *
 * This component renders the score, status label, summary, and missing files.
 */
const buildPackHealthCard = `function BuildPackHealthCard({
  health,
}: {
  health: BuildPackHealth;
}) {
  const tone =
    health.status === "complete"
      ? {
          background: "#ecfdf5",
          border: "#bbf7d0",
          text: "#166534",
        }
      : health.status === "missing"
        ? {
            background: "#fef2f2",
            border: "#fecaca",
            text: "#991b1b",
          }
        : {
            background: "#fff7ed",
            border: "#fed7aa",
            text: "#9a3412",
          };

  return (
    <div
      style={{
        border: \`1px solid \${tone.border}\`,
        borderRadius: "18px",
        background: tone.background,
        padding: "15px",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "10px",
        }}
      >
        <div>
          <div
            style={{
              color: tone.text,
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Build pack health
          </div>

          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "20px",
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {health.label} · {health.score}%
          </strong>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "28px",
            padding: "0 11px",
            borderRadius: "999px",
            background: "#ffffff",
            color: tone.text,
            fontSize: "12px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {health.label}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 10px",
          color: "#374151",
          fontSize: "13px",
          lineHeight: 1.55,
        }}
      >
        {health.summary}
      </p>

      {health.missingFiles.length > 0 ? (
        <div
          style={{
            borderTop: \`1px solid \${tone.border}\`,
            paddingTop: "10px",
          }}
        >
          <div
            style={{
              color: tone.text,
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Missing files
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "#111827",
            }}
          >
            {health.missingFiles.map((filePath) => (
              <li
                key={filePath}
                style={{
                  marginBottom: "5px",
                  fontSize: "13px",
                  lineHeight: 1.45,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {filePath}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

`;

if (!source.includes("function BuildPackHealthCard(")) {
  if (source.includes("function BuildPackContentsPanel(")) {
    insertBefore(
      "BuildPackHealthCard component",
      "function BuildPackContentsPanel(",
      buildPackHealthCard
    );
  } else if (source.includes("function DeployReadinessPanel(")) {
    insertBefore(
      "BuildPackHealthCard component",
      "function DeployReadinessPanel(",
      buildPackHealthCard
    );
  } else {
    insertBefore(
      "BuildPackHealthCard component",
      "function PublishReadinessWorkspace(",
      buildPackHealthCard
    );
  }

  console.log("Added BuildPackHealthCard component.");
} else {
  console.log("BuildPackHealthCard already exists.");
}

/**
 * 4. Render the health card inside BuildPackContentsPanel.
 */
updateBetween(
  "BuildPackContentsPanel",
  "function BuildPackContentsPanel({",
  "function BuildPackFileCard(",
  (section) => {
    let updated = section;

    if (!updated.includes("const buildPackHealth = getBuildPackHealth(files);")) {
      updated = updated.replace(
        `  const buildPackFiles = getBuildPackFileStatuses(files);
  const existingCount = buildPackFiles.filter((file) => file.exists).length;`,
        `  const buildPackFiles = getBuildPackFileStatuses(files);
  const buildPackHealth = getBuildPackHealth(files);
  const existingCount = buildPackFiles.filter((file) => file.exists).length;`
      );

      console.log("Added buildPackHealth calculation.");
    } else {
      console.log("buildPackHealth calculation already exists.");
    }

    if (!updated.includes("<BuildPackHealthCard health={buildPackHealth} />")) {
      updated = updated.replace(
        `      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >`,
        `      <BuildPackHealthCard health={buildPackHealth} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >`
      );

      console.log("Rendered BuildPackHealthCard inside BuildPackContentsPanel.");
    } else {
      console.log("BuildPackHealthCard already rendered.");
    }

    return updated;
  }
);

save();

console.log("✅ Build Pack health score wiring complete.");
console.log(`Backup created at: ${backupPath}`);