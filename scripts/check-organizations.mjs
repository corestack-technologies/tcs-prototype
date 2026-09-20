import ts from "typescript"
import path from "node:path"
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile)
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
  )
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".")
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
const touched = new Set([
  "src/App.tsx",
  "src/components/Login.tsx",
  "src/main.tsx",
  "src/clients/ClientShell.tsx",
  ...[
    "OrgOpportunity",
    "OrgApplication",
    "OrgReviewStatus",
    "OrgActivation",
    "OwnerShell",
    "OwnerDashboard",
    "OwnerProfile",
    "OwnerSettings",
  ].map((name) => `src/components/org/${name}.tsx`),
])
const relevant = diagnostics.filter(
  (item) =>
    !item.file ||
    (item.file &&
      (path
        .relative(".", item.file.fileName)
        .replaceAll("\\", "/")
        .startsWith("src/organizations/") ||
        touched.has(
          path.relative(".", item.file.fileName).replaceAll("\\", "/"),
        ))),
)
if (relevant.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(relevant, {
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getCanonicalFileName: (file) => file,
      getNewLine: () => "\n",
    }),
  )
  process.exitCode = 1
} else
  console.log(
    "Organizations module and its integration files: no TypeScript diagnostics.",
  )
console.log(
  `${diagnostics.length - relevant.length} diagnostics outside this module.`,
)
