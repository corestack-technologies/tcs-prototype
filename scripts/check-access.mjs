import ts from "typescript"
import path from "node:path"
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile)
if (config.error)
  throw Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"))
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".")
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
const integration = new Set([
  "src/App.tsx",
  "src/main.tsx",
  ...[
    "GroupSetupWizard",
    "GroupRecruitment",
    "GroupPositions",
    "GroupRulesReview",
    "GroupReadiness",
    "GroupActivated",
    "OwnerGroups",
    "OwnerShell",
    "OwnerDashboard",
  ].map((n) => "src/components/org/" + n + ".tsx"),
])
const relevant = diagnostics.filter((d) => {
  if (!d.file) return true
  const p = path.relative(".", d.file.fileName).replaceAll("\\", "/")
  return (
    p.startsWith("src/access/") ||
    p.startsWith("src/operations/") ||
    p.startsWith("src/clients/") ||
    p.startsWith("src/groups/") ||
    p.startsWith("src/rounds/") ||
    p.startsWith("src/lifecycle/") ||
    p.startsWith("src/payments/") ||
    p.startsWith("src/payouts/") ||
    p.startsWith("src/reconciliation/") ||
    p.startsWith("src/organizations/") ||
    integration.has(p)
  )
})
if (relevant.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(relevant, {
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getCanonicalFileName: (f) => f,
      getNewLine: () => "\n",
    }),
  )
  process.exitCode = 1
} else
  console.log(
    "Modules 6A and 1?5 and their integration files: no TypeScript diagnostics.",
  )
console.log(
  `${diagnostics.length - relevant.length} diagnostics outside this module.`,
)
