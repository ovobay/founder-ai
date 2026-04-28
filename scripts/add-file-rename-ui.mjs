import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "app/page.tsx");

if (!fs.existsSync(pagePath)) {
  throw new Error(`Could not find ${pagePath}`);
}

let source = fs.readFileSync(pagePath, "utf8");

function replaceRegex(label, regex, replacement) {
  if (!regex.test(source)) {
    throw new Error(`Could not find block for: ${label}`);
  }

  source = source.replace(regex, replacement);
}

function replaceLiteral(label, find, replacement) {
  if (!source.includes(find)) {
    throw new Error(`Could not find block for: ${label}`);
  }

  source = source.replace(find, replacement);
}

replaceRegex(
  "saveSelectedFile function signature",
  /async function saveSelectedFile\(\s*fileId:\s*string,\s*contents:\s*string\s*\)\s*\{/,
  `async function saveSelectedFile(fileId: string, filePath: string, contents: string) {`
);

replaceRegex(
  "saveSelectedFile request body",
  /body:\s*JSON\.stringify\(\{\s*contents,\s*status:\s*"updated",\s*\}\),/,
  `body: JSON.stringify({
        path: filePath,
        contents,
        status: "updated",
      }),`
);

source = source.replaceAll(
  `onSaveFile: (fileId: string, contents: string) => Promise<DatabaseProjectFile>;`,
  `onSaveFile: (
    fileId: string,
    filePath: string,
    contents: string
  ) => Promise<DatabaseProjectFile>;`
);

replaceRegex(
  "CodeWorkspace local state",
  /const \[draftContents,\s*setDraftContents\]\s*=\s*useState\(selectedFile\?\.contents \?\? ""\);\s*const \[statusMessage,\s*setStatusMessage\]\s*=\s*useState\(""\);/,
  `const [draftPath, setDraftPath] = useState(selectedFile?.path ?? "");
  const [draftContents, setDraftContents] = useState(selectedFile?.contents ?? "");
  const [statusMessage, setStatusMessage] = useState("");`
);

replaceRegex(
  "CodeWorkspace dirty state",
  /const isDatabaseBacked = Boolean\(databaseFile\);\s*const isDirty = draftContents !== \(selectedFile\?\.contents \?\? ""\);/,
  `const isDatabaseBacked = Boolean(databaseFile);
  const isPathDirty = draftPath !== (selectedFile?.path ?? "");
  const isContentDirty = draftContents !== (selectedFile?.contents ?? "");
  const isDirty = isPathDirty || isContentDirty;`
);

replaceRegex(
  "CodeWorkspace effect",
  /useEffect\(\(\) => \{\s*setDraftContents\(selectedFile\?\.contents \?\? ""\);\s*setStatusMessage\(""\);\s*\}, \[selectedFile\?\.id,\s*selectedFile\?\.contents\]\);/,
  `useEffect(() => {
    setDraftPath(selectedFile?.path ?? "");
    setDraftContents(selectedFile?.contents ?? "");
    setStatusMessage("");
  }, [selectedFile?.id, selectedFile?.path, selectedFile?.contents]);`
);

replaceRegex(
  "CodeWorkspace save call",
  /await onSaveFile\(selectedFile\.id,\s*draftContents\);/,
  `await onSaveFile(selectedFile.id, draftPath, draftContents);`
);

const oldFileInfoBlock = `            <div
              style={{
                marginTop: "4px",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              {isDatabaseBacked
                ? \`Database-backed file · \${selectedFile.description}\`
                : \`Generated preview file · save disabled until synced\`}
            </div>
          </div>`;

const newFileInfoBlock = `            <div
              style={{
                marginTop: "4px",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              {isDatabaseBacked
                ? \`Database-backed file · \${selectedFile.description}\`
                : \`Generated preview file · save disabled until synced\`}
            </div>

            <input
              value={draftPath}
              onChange={(event) => setDraftPath(event.target.value)}
              disabled={!isDatabaseBacked || isSaving || isDeleting}
              spellCheck={false}
              aria-label="File path"
              title={
                isDatabaseBacked
                  ? "Rename file path"
                  : "Only database-backed files can be renamed"
              }
              style={{
                width: "100%",
                maxWidth: "560px",
                height: "34px",
                marginTop: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: isDatabaseBacked ? "#ffffff" : "#f9fafb",
                color: "#111827",
                padding: "0 11px",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                outline: "none",
              }}
            />
          </div>`;

replaceLiteral("CodeWorkspace file path input block", oldFileInfoBlock, newFileInfoBlock);

source = source.replaceAll(
  `? "Save file"
                  : "Only database-backed files can be saved"`,
  `? "Save file path and contents"
                  : "Only database-backed files can be saved"`
);

fs.writeFileSync(pagePath, source);

console.log("✅ app/page.tsx updated with file rename UI.");
console.log("You can now edit the file path and save it with the file contents.");