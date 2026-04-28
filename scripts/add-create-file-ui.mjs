import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

function save() {
  fs.writeFileSync(pagePath, source);
}

function die(message) {
  save();
  throw new Error(message);
}

function replaceOnce(label, find, replacement) {
  if (!source.includes(find)) {
    die(`Could not update app/page.tsx. Missing block: ${label}`);
  }

  source = source.replace(find, replacement);
}

function replaceRegex(label, regex, replacement) {
  if (!regex.test(source)) {
    die(`Could not update app/page.tsx. Missing regex block: ${label}`);
  }

  source = source.replace(regex, replacement);
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
 * 1. Add createProjectFile before saveSelectedFile.
 */
const createProjectFileFunction = `

  async function createProjectFile(path: string, contents = "") {
    if (!currentProject) {
      throw new Error("No active project workspace loaded.");
    }

    const response = await fetch(\`/api/projects/\${currentProject.id}/files\`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        contents,
        description: "Manually created project file.",
        status: "created",
      }),
    });

    const result = await readApiResponse<{
      files: DatabaseProjectFile[];
    }>(response);

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error ?? "Failed to create project file.");
    }

    const databaseFiles = parseProjectFiles(result.data.files);
    const mappedFiles = databaseFiles
      .filter((file) => file.status !== "deleted")
      .map(mapProjectFileToChangedFile);

    setProjectFiles(databaseFiles);
    setChangedFiles(mappedFiles);

    const createdFile = databaseFiles.find((file) => file.path === path);

    if (createdFile) {
      setSelectedFileId(createdFile.id);
      setWorkspaceView("code");
    }

    return createdFile;
  }
`;

if (!source.includes("async function createProjectFile(path: string, contents = \"\")")) {
  replaceRegex(
    "insert createProjectFile before saveSelectedFile",
    /\n\s+async function saveSelectedFile\(fileId: string, path: string, contents: string\) \{/,
    `${createProjectFileFunction}\n  async function saveSelectedFile(fileId: string, path: string, contents: string) {`
  );
  console.log("Added createProjectFile.");
} else {
  console.log("createProjectFile already exists.");
}

/**
 * 2. Add onCreateFile to PreviewContent JSX call.
 */
if (!source.includes("onCreateFile={createProjectFile}")) {
  replaceOnce(
    "PreviewContent JSX prop",
    `            onDeleteFile={deleteSelectedFile}
            setWorkspaceError={setWorkspaceError}`,
    `            onDeleteFile={deleteSelectedFile}
            onCreateFile={createProjectFile}
            setWorkspaceError={setWorkspaceError}`
  );
  console.log("Added onCreateFile prop to PreviewContent call.");
} else {
  console.log("PreviewContent JSX prop already exists.");
}

/**
 * 3. Update PreviewContent function section only.
 */
updateBetween(
  "PreviewContent",
  "function PreviewContent({",
  "function LoadingWorkspace()",
  (section) => {
    let updated = section;

    if (!updated.includes("  onCreateFile,")) {
      updated = updated.replace(
        `  onDeleteFile,
  setWorkspaceError,`,
        `  onDeleteFile,
  onCreateFile,
  setWorkspaceError,`
      );
      console.log("Added onCreateFile to PreviewContent destructuring.");
    } else {
      console.log("PreviewContent destructuring already has onCreateFile.");
    }

    if (!updated.includes("onCreateFile: (")) {
      updated = updated.replace(
        `  onDeleteFile: (fileId: string) => Promise<void>;
  setWorkspaceError: (value: string) => void;`,
        `  onDeleteFile: (fileId: string) => Promise<void>;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;`
      );
      console.log("Added onCreateFile to PreviewContent prop types.");
    } else {
      console.log("PreviewContent prop types already have onCreateFile.");
    }

    if (!updated.includes("onCreateFile={onCreateFile}")) {
      updated = updated.replace(
        `          setSelectedFileId={setSelectedFileId}
        />`,
        `          setSelectedFileId={setSelectedFileId}
          onCreateFile={onCreateFile}
          setWorkspaceError={setWorkspaceError}
        />`
      );
      console.log("Passed onCreateFile to FilesDrawer.");
    } else {
      console.log("FilesDrawer call already has onCreateFile.");
    }

    return updated;
  }
);

/**
 * 4. Update FilesDrawer function section only.
 */
updateBetween(
  "FilesDrawer",
  "function FilesDrawer({",
  "function CodeWorkspace(",
  (section) => {
    let updated = section;

    if (!updated.includes("  onCreateFile,")) {
      updated = updated.replace(
        `  selectedFileId,
  setSelectedFileId,`,
        `  selectedFileId,
  setSelectedFileId,
  onCreateFile,
  setWorkspaceError,`
      );
      console.log("Added onCreateFile to FilesDrawer destructuring.");
    } else {
      console.log("FilesDrawer destructuring already has onCreateFile.");
    }

    if (!updated.includes("onCreateFile: (")) {
      updated = updated.replace(
        `  selectedFileId: string;
  setSelectedFileId: (fileId: string) => void;
}) {`,
        `  selectedFileId: string;
  setSelectedFileId: (fileId: string) => void;
  onCreateFile: (
    path: string,
    contents?: string
  ) => Promise<DatabaseProjectFile | undefined>;
  setWorkspaceError: (value: string) => void;
}) {`
      );
      console.log("Added onCreateFile to FilesDrawer prop types.");
    } else {
      console.log("FilesDrawer prop types already have onCreateFile.");
    }

    if (!updated.includes("const [newFilePath, setNewFilePath] = useState(\"\"")) {
      updated = updated.replace(
        `}) {
  return (`,
        `}) {
  const [newFilePath, setNewFilePath] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  async function handleCreateFile() {
    const normalizedPath = newFilePath.trim();

    if (!normalizedPath) {
      setCreateMessage("Enter a file path.");
      return;
    }

    setIsCreatingFile(true);
    setCreateMessage("");
    setWorkspaceError("");

    try {
      await onCreateFile(
        normalizedPath,
        \`// \${normalizedPath}\\n\\nexport const created = true;\\n\`
      );

      setNewFilePath("");
      setCreateMessage("File created.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create file.";

      setCreateMessage(message);
      setWorkspaceError(message);
    } finally {
      setIsCreatingFile(false);
    }
  }

  return (`
      );
      console.log("Added create-file state and handler.");
    } else {
      console.log("Create-file state already exists.");
    }

    if (!updated.includes("Create a database-backed project file.")) {
      updated = updated.replace(
        `      </div>

      <div className="files-list">`,
        `      </div>

      <div
        style={{
          display: "grid",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <input
          value={newFilePath}
          onChange={(event) => setNewFilePath(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleCreateFile();
            }
          }}
          placeholder="components/new-file.tsx"
          disabled={isCreatingFile}
          spellCheck={false}
          style={{
            width: "100%",
            height: "34px",
            border: "1px solid #d1d5db",
            borderRadius: "11px",
            background: "#ffffff",
            color: "#111827",
            padding: "0 11px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{
              color:
                createMessage.toLowerCase().includes("failed") ||
                createMessage.toLowerCase().includes("enter") ||
                createMessage.toLowerCase().includes("invalid") ||
                createMessage.toLowerCase().includes("already")
                  ? "#991b1b"
                  : "#6b7280",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {createMessage || "Create a database-backed project file."}
          </span>

          <button
            type="button"
            onClick={handleCreateFile}
            disabled={isCreatingFile}
          >
            {isCreatingFile ? "Creating..." : "Create file"}
          </button>
        </div>
      </div>

      <div className="files-list">`
      );
      console.log("Added create-file UI.");
    } else {
      console.log("Create-file UI already exists.");
    }

    return updated;
  }
);

save();

console.log("✅ app/page.tsx repaired and updated.");
console.log("Create-file UI is wired to POST /api/projects/[projectId]/files.");