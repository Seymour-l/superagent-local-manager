const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/poll-BNESIoHV.js'
let t = fs.readFileSync(file, 'utf8')
if (t.includes('Super Agent 管理者模式：absolute')) { console.log('already patched'); process.exit(0) }
// 用 indexOf 定位（避开正则转义地狱）
const anchor = 'const absolute = (description) => s.string().pattern('
const i = t.indexOf(anchor)
if (i < 0) { console.error('anchor not found'); process.exit(1) }
// 找这一行的结尾（到 `;` 之后的换行）
const lineEnd = t.indexOf('\n', i)
const oldLine = t.slice(i, lineEnd)
console.log('old line:', JSON.stringify(oldLine))
const neuLine = 'const absolute = (description) => s.string().pattern(/^(\\/|[A-Za-z]:[\\\\\\/])/).description(`${description} Absolute path.`); /* Super Agent 管理者模式：absolute */'
t = t.slice(0, i) + neuLine + t.slice(lineEnd)
if (t.includes('path === "" || path.startsWith("/")')) {
  t = t.replace('path === "" || path.startsWith("/")', 'path === "" || /^(\\/|[A-Za-z]:[\\\\\\/])/.test(path)')
  console.log('executor.directory patched')
}
fs.writeFileSync(file, t, 'utf8')
console.log('patched ok')
