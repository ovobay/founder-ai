import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");
const backupPath = path.join(
  process.cwd(),
  `app/page.backup-before-sql-migration-generator-${Date.now()}.tsx`
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
 * 1. Add SQL migration generator helpers.
 */
const sqlMigrationHelpers = `function sanitizeSqlIdentifier(value: string) {
  const safe = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!safe) {
    return "generated_table";
  }

  if (/^[0-9]/.test(safe)) {
    return \`table_\${safe}\`;
  }

  return safe;
}

function inferSqlType(fieldName: string) {
  const field = fieldName.toLowerCase();

  if (field === "id") return "uuid primary key default gen_random_uuid()";
  if (field.endsWith("_id")) return "uuid";
  if (field.includes("email")) return "text";
  if (field.includes("phone")) return "text";
  if (field.includes("url")) return "text";
  if (field.includes("status")) return "text";
  if (field.includes("role")) return "text";
  if (field.includes("type")) return "text";
  if (field.includes("name")) return "text";
  if (field.includes("title")) return "text";
  if (field.includes("description")) return "text";
  if (field.includes("content")) return "text";
  if (field.includes("body")) return "text";
  if (field.includes("amount")) return "numeric";
  if (field.includes("price")) return "numeric";
  if (field.includes("value")) return "numeric";
  if (field.includes("score")) return "integer";
  if (field.includes("count")) return "integer";
  if (field.includes("quantity")) return "integer";
  if (field.includes("is_")) return "boolean default false";
  if (field.includes("published")) return "boolean default false";
  if (field.endsWith("_at")) return "timestamptz";
  if (field.includes("date")) return "date";
  if (field.includes("metadata")) return "jsonb default '{}'::jsonb";
  if (field.includes("settings")) return "jsonb default '{}'::jsonb";

  return "text";
}

function createSqlMigrationContents(architecture: ArchitecturePlan) {
  const tables = architecture.tables;

  const lines = [
    "-- Founder AI generated migration",
    "-- Review before running in production. Obviously. Let us not YOLO the database like a caffeinated intern.",
    "",
    "create extension if not exists pgcrypto;",
    "",
  ];

  if (tables.length === 0) {
    lines.push("-- No database tables were planned for this build.");
    return lines.join("\\n");
  }

  for (const table of tables) {
    const tableName = sanitizeSqlIdentifier(table.name || table.id);
    const rawFields = table.fields.length > 0 ? table.fields : ["id", "created_at", "updated_at"];
    const fields = Array.from(new Set(["id", ...rawFields, "created_at", "updated_at"]));

    lines.push(\`-- \${table.purpose || \`Stores \${tableName} records.\`}\`);
    lines.push(\`create table if not exists public.\${tableName} (\`);

    const columnLines = fields.map((field) => {
      const columnName = sanitizeSqlIdentifier(field);
      const type = inferSqlType(columnName);

      if (columnName === "created_at") {
        return "  created_at timestamptz not null default now()";
      }

      if (columnName === "updated_at") {
        return "  updated_at timestamptz not null default now()";
      }

      return \`  \${columnName} \${type}\`;
    });

    lines.push(columnLines.join(",\\n"));
    lines.push(");");
    lines.push("");
    lines.push(\`alter table public.\${tableName} enable row level security;\`);
    lines.push("");
    lines.push(\`drop policy if exists "\${tableName}_authenticated_read" on public.\${tableName};\`);
    lines.push(\`create policy "\${tableName}_authenticated_read"\`);
    lines.push(\`on public.\${tableName}\`);
    lines.push("for select");
    lines.push("to authenticated");
    lines.push("using (true);");
    lines.push("");
    lines.push(\`drop policy if exists "\${tableName}_authenticated_insert" on public.\${tableName};\`);
    lines.push(\`create policy "\${tableName}_authenticated_insert"\`);
    lines.push(\`on public.\${tableName}\`);
    lines.push("for insert");
    lines.push("to authenticated");
    lines.push("with check (true);");
    lines.push("");
    lines.push(\`drop policy if exists "\${tableName}_authenticated_update" on public.\${tableName};\`);
    lines.push(\`create policy "\${tableName}_authenticated_update"\`);
    lines.push(\`on public.\${tableName}\`);
    lines.push("for update");
    lines.push("to authenticated");
    lines.push("using (true)");
    lines.push("with check (true);");
    lines.push("");
    lines.push(\`create index if not exists \${tableName}_created_at_idx on public.\${tableName} (created_at desc);\`);
    lines.push("");
  }

  return lines.join("\\n");
}

`;

if (!source.includes("function createSqlMigrationContents(")) {
  if (source.includes("function createEnvExampleContents(")) {
    insertBefore(
      "SQL migration helpers",
      "function createEnvExampleContents(",
      sqlMigrationHelpers
    );
  } else if (source.includes("function EnvironmentVariablesPanel(")) {
    insertBefore(
      "SQL migration helpers",
      "function EnvironmentVariablesPanel(",
      sqlMigrationHelpers
    );
  } else {
    insertBefore(
      "SQL migration helpers",
      "function PublishReadinessWorkspace(",
      sqlMigrationHelpers
    );
  }

  console.log("Added SQL migration helper functions.");
} else {
  console.log("SQL migration helper functions already exist.");
}

/**
 * 2. Pass create/save handlers into ArchitectureWorkspace.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (
      updated.includes("<ArchitectureWorkspace") &&
      !updated.includes("onCreateFile={onCreateFile}") &&
      !updated.includes("onSaveFile={onSaveFile}")
    ) {
      updated = updated.replace(
        `<ArchitectureWorkspace previewState={previewState} />`,
        `<ArchitectureWorkspace
              previewState={previewState}
              files={files}
              onCreateFile={onCreateFile}
              onSaveFile={onSaveFile}
              setWorkspaceError={setWorkspaceError}
            />`
      );

      console.log("Passed file handlers into ArchitectureWorkspace.");
    } else {
      console.log("ArchitectureWorkspace already has file handlers or marker differs.");
    }

    return updated;
  }
);

/**
 * 3. Update ArchitectureWorkspace props and add export button.
 */
updateBetween(
  "ArchitectureWorkspace",
  "function ArchitectureWorkspace({",
  "function HistoryWorkspace(",
  (section) => {
    let updated = section;

    if (!updated.includes("onCreateFile,")) {
      updated = updated.replace(
        `function ArchitectureWorkspace({
  previewState,
}: {
  previewState: PreviewState;
}) {`,
        `function ArchitectureWorkspace({
  previewState,
  files,
  onCreateFile,
  onSaveFile,
  setWorkspaceError,
}: {
  previewState: PreviewState;
  files: ChangedFile[];
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;
  setWorkspaceError: (value: string) => void;
}) {`
      );

      console.log("Updated ArchitectureWorkspace props.");
    } else {
      console.log("ArchitectureWorkspace props already include file handlers.");
    }

    if (!updated.includes("const [isExportingMigration")) {
      updated = updated.replace(
        `}) {`,
        `}) {
  const [isExportingMigration, setIsExportingMigration] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  async function handleExportSqlMigration() {
    setIsExportingMigration(true);
    setMigrationMessage("");
    setWorkspaceError("");

    const filePath = "supabase/migrations/generated_architecture.sql";
    const contents = createSqlMigrationContents(previewState.architecture);
    const existingFile = files.find((file) => file.path === filePath);

    try {
      if (existingFile) {
        await onSaveFile(existingFile.id, filePath, contents);
        setMigrationMessage("SQL migration updated.");
      } else {
        await onCreateFile(filePath, contents);
        setMigrationMessage("SQL migration exported.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export SQL migration.";

      setMigrationMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsExportingMigration(false);
    }
  }`
      );

      console.log("Added SQL migration export state and handler.");
    } else {
      console.log("SQL migration export handler already exists.");
    }

    if (!updated.includes("Export SQL migration")) {
      updated = updated.replace(
        `          <p
            style={{
              margin: "12px 0 0",
              maxWidth: "780px",
              color: "#4b5563",
              fontSize: "15px",
              lineHeight: 1.65,
            }}
          >
            {previewState.modules.length} modules,{" "}
            {previewState.architecture.tables.length} tables,{" "}
            {previewState.architecture.endpoints.length} API routes, and{" "}
            {previewState.architecture.securityRules.length} security rules
            planned from the prompt.
          </p>
        </section>`,
        `          <p
            style={{
              margin: "12px 0 0",
              maxWidth: "780px",
              color: "#4b5563",
              fontSize: "15px",
              lineHeight: 1.65,
            }}
          >
            {previewState.modules.length} modules,{" "}
            {previewState.architecture.tables.length} tables,{" "}
            {previewState.architecture.endpoints.length} API routes, and{" "}
            {previewState.architecture.securityRules.length} security rules
            planned from the prompt.
          </p>

          <div
            style={{
              marginTop: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color:
                  migrationMessage.toLowerCase().includes("failed") ||
                  migrationMessage.toLowerCase().includes("already")
                    ? "#991b1b"
                    : "#4b5563",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {migrationMessage ||
                "Generate a starter SQL migration from the planned database tables."}
            </span>

            <button
              type="button"
              className="pill-button"
              onClick={handleExportSqlMigration}
              disabled={isExportingMigration}
            >
              {isExportingMigration
                ? "Exporting..."
                : "Export SQL migration"}
            </button>
          </div>
        </section>`
      );

      console.log("Added Export SQL migration button.");
    } else {
      console.log("Export SQL migration button already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ SQL migration generator wiring complete.");
console.log(`Backup created at: ${backupPath}`);