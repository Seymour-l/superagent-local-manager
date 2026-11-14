const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/poll-BNESIoHV.js'
let t = fs.readFileSync(file, 'utf8')
if (t.includes('Super Agent 管理者模式：executor.directory')) { console.log('already patched'); process.exit(0) }
const old = 'directory: z.string().trim().refine((path) => path === "" || path.startsWith("/"), "An absolute path, or empty for <stateDir>/work").default("")'
if (!t.includes(old)) { console.error('not in poll chunk; check index only'); process.exit(0) }
const neu = 'directory: z.string().trim().refine((path) => path === "" || /^(\\/|[A-Za-z]:[\\\\\\/])/.test(path), "An absolute path, or empty for <stateDir>/work").default("") /* Super Agent 管理者模式：executor.directory */'
t = t.replace(old, neu)
fs.writeFileSync(file, t, 'utf8')
console.log('patched poll chunk ok')
