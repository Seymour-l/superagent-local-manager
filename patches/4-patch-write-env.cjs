const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/poll-BNESIoHV.js'
let t = fs.readFileSync(file, 'utf8')
if (t.includes('Super Agent 管理者模式：writeEnvironment')) { console.log('already patched'); process.exit(0) }
// gh shim: 无 CLI 时给出占位失败脚本而不是空命令
const old1 = '\tawait shim("gh", run(github.cli));'
const neu1 = `\t/* Super Agent 管理者模式：无 GitHub CLI 时 gh shim 报错而非空命令 */
\tawait shim("gh", github.cli ? run(github.cli) : fail("gh is unavailable: this installation has no GitHub account."));`
if (!t.includes(old1)) { console.error('gh shim not found'); process.exit(1) }
t = t.replace(old1, neu1)
// git 凭据配置：无 CLI 时跳过 credential helper 行
const old2 = '\t\t`\\thelper = ${gitQuote(credentialHelper(github.cli))}`,'
const neu2 = `\t\t...(github.cli ? [\`\\thelper = \${gitQuote(credentialHelper(github.cli))}\`] : []),
\t\t/* Super Agent 管理者模式：writeEnvironment */`
if (!t.includes(old2)) { console.error('cred line not found'); process.exit(1) }
t = t.replace(old2, neu2)
fs.writeFileSync(file, t, 'utf8')
console.log('patched writeEnvironment ok')
