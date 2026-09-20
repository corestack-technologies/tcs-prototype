import ts from 'typescript'
import path from 'node:path'

const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile)
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.')
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
const touched = new Set(['src/App.tsx', 'src/main.tsx', 'src/components/Login.tsx', 'src/components/Signup.tsx', 'src/components/ui.tsx'])
const relevant = diagnostics.filter(diagnostic => {
  if (!diagnostic.file) return true
  const filename = path.relative('.', diagnostic.file.fileName).replaceAll('\\', '/')
  return filename.startsWith('src/clients/') || touched.has(filename)
})
if (relevant.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(relevant, { getCurrentDirectory: ts.sys.getCurrentDirectory, getCanonicalFileName: file => file, getNewLine: () => '\n' }))
  process.exitCode = 1
} else console.log('Clients module and its touched integration files: no TypeScript diagnostics.')
console.log(`${diagnostics.length - relevant.length} diagnostics remain outside this module. Run npm run typecheck for the full project result.`)
