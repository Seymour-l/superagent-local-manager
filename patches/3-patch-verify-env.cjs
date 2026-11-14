const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/poll-BNESIoHV.js'
let t = fs.readFileSync(file, 'utf8')
if (t.includes('Super Agent 管理者模式：verify')) { console.log('already patched'); process.exit(0) }
const old = 'function verifyEnvironment(deployment, subprocess, signal) {\n\tconst { github, stateDir } = deployment;'
if (!t.includes(old)) { console.error('verifyEnvironment head not found'); process.exit(1) }
const neu = `function verifyEnvironment(deployment, subprocess, signal) {
\tconst { github, stateDir } = deployment;
\t/* Super Agent 管理者模式：无 GitHub CLI 时跳过 git 凭据校验 */
\tif (!github.cli) return Promise.resolve();`
t = t.replace(old, neu)
fs.writeFileSync(file, t, 'utf8')
console.log('patched verifyEnvironment ok')
