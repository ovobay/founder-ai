import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-run-migration-instructions-${Date.now()}.tsx`
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
 * 1. Add migration instructions component before ArchitectureWorkspace.
 */
const migrationInstructionsComponent = `function RunMigrationInstructionsPanel({
  tableCount,
}: {
  tableCount: number;
}) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 6px",
              color: "#111827",
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Run migration instructions
          </h3>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {tableCount > 0
              ? \`\${tableCount} planned database table\${tableCount === 1 ? "" : "s"} detected. Export the SQL migration, review it, then run it in Supabase.\`
              : "No planned database tables detected yet. Generate a build with database-backed features first."}
          </p>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "26px",
            padding: "0 10px",
            borderRadius: "999px",
            background: tableCount > 0 ? "#fff7ed" : "#f3f4f6",
            color: tableCount > 0 ? "#9a3412" : "#4b5563",
            fontSize: "11px",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {tableCount > 0 ? "Needs review" : "No tables"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        <MigrationInstructionStep
          number="1"
          title="Export the generated SQL"
          body="Click Export SQL migration in this Architecture view. The generated file will appear in the project file tree."
        />

        <MigrationInstructionStep
          number="2"
          title="Open the generated file"
          body="Open Code view and select supabase/migrations/generated_architecture.sql. Review the tables, fields, indexes, and RLS policies."
        />

        <MigrationInstructionStep
          number="3"
          title="Run it in Supabase"
          body="Go to Supabase Dashboard → SQL Editor → New Query, paste the SQL, then click Run."
        />

        <MigrationInstructionStep
          number="4"
          title="Verify production safety"
          body="Confirm Row Level Security is enabled, policies are appropriate, and no server-only secrets are exposed to the browser."
        />
      </div>

      <div
        style={{
          marginTop: "14px",
          border: "1px solid #fee2e2",
          borderRadius: "16px",
          background: "#fef2f2",
          padding: "13px",
          color: "#991b1b",
          fontSize: "13px",
          lineHeight: 1.55,
          fontWeight: 700,
        }}
      >
        Review the SQL before running it. Generated migrations are starter scaffolds, not divine tablets carried down from Mount Production.
      </div>
    </section>
  );
}

function MigrationInstructionStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <article
      style={{
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        background: "#f9fafb",
        padding: "13px",
        display: "flex",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "999px",
          background: "#111827",
          color: "#ffffff",
          display: "grid",
          placeItems: "center",
          fontSize: "12px",
          fontWeight: 900,
          flex: "0 0 auto",
        }}
      >
        {number}
      </div>

      <div>
        <strong
          style={{
            display: "block",
            color: "#111827",
            fontSize: "13px",
            lineHeight: 1.35,
            marginBottom: "4px",
          }}
        >
          {title}
        </strong>

        <span
          style={{
            color: "#4b5563",
            fontSize: "13px",
            lineHeight: 1.55,
          }}
        >
          {body}
        </span>
      </div>
    </article>
  );
}

`;

if (!source.includes("function RunMigrationInstructionsPanel(")) {
  insertBefore(
    "RunMigrationInstructionsPanel component",
    "function ArchitectureWorkspace({",
    migrationInstructionsComponent
  );
  console.log("Added RunMigrationInstructionsPanel component.");
} else {
  console.log("RunMigrationInstructionsPanel component already exists.");
}

/**
 * 2. Render instructions in ArchitectureWorkspace.
 */
updateBetween(
  "ArchitectureWorkspace",
  "function ArchitectureWorkspace({",
  "function HistoryWorkspace(",
  (section) => {
    let updated = section;

    if (updated.includes("<RunMigrationInstructionsPanel")) {
      console.log("ArchitectureWorkspace already renders migration instructions.");
      return updated;
    }

    const marker = `        <ArchitectureSection
          title="Detected modules"`;

    if (!updated.includes(marker)) {
      console.log("Could not find Detected modules marker. Skipping insertion.");
      return updated;
    }

    updated = updated.replace(
      marker,
      `        <RunMigrationInstructionsPanel
          tableCount={previewState.architecture.tables.length}
        />

${marker}`
    );

    console.log("Added RunMigrationInstructionsPanel to ArchitectureWorkspace.");
    return updated;
  }
);

save();

console.log("✅ Run migration instructions panel wiring complete.");
console.log(`Backup created at: ${backupPath}`);