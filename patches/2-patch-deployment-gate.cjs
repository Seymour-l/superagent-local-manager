const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/poll-BNESIoHV.js'
let t = fs.readFileSync(file, 'utf8')
const marker = 'resolveDeployment(machine, github, probe, path = process.env.PATH ?? "") {'
if (!t.includes(marker)) { console.error('resolveDeployment not found'); process.exit(1) }
if (t.includes('local-superagent')) { console.log('already patched'); process.exit(0) }
const oldGate = '\tconst accounts = GithubAccountsSchema.parse(github ?? {});\n\tconst remote = accounts.repository;\n\tif (!remote) throw new SetupError("repositoryUnset");'
if (!t.includes(oldGate)) { console.error('gate block not found'); process.exit(1) }
const newGate = `\tconst accounts = GithubAccountsSchema.parse(github ?? {});
\tconst remote = accounts.repository;
\tif (!remote) {
\t\t/* Super Agent 管理者模式：不配 GitHub 仓库也能运行（仅本地 inbox 来源）。 */
\t\treturn { ...machine, repository: "", github: { cli: "", login: "local-superagent", noreply: "superagent@localhost" } };
\t}`
t = t.replace(oldGate, newGate)
fs.writeFileSync(file, t, 'utf8')
console.log('patched ok')
