const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/index.js'
let t = fs.readFileSync(file, 'utf8')
// stateDir 是 C:\... 且 executor.directory 是 C:\...，join 应该保留盘符。但报错是 \Users\... — 说明实际用的 stateDir 是 /Users/...（unix 风格）。
// profile 里我写回了 C:\... 但 db 的 settings 或运行时可能仍从某处读 /Users/...。
// 直接找 executionRoot 调用处把 win 路径规范化：
if (t.includes('Super Agent 管理者模式：executionRoot')) { console.log('already patched'); process.exit(0) }
const anchor = 'const executionRoot = (settings, stateDir) => settings.executor.directory || join(stateDir, "work");'
if (!t.includes(anchor)) { console.error('executionRoot not found'); process.exit(1) }
const neu = `const executionRoot = (settings, stateDir) => {
\t/* Super Agent 管理者模式：executionRoot — Windows 上把 unix 风格 /Users/... 规范化为盘符路径 */
\tconst win = (p) => process.platform === 'win32' && /^\\\\/.test(p) ? 'C:' + p : p;
\treturn win(settings.executor.directory || join(stateDir, "work"));
};`
t = t.replace(anchor, neu)
fs.writeFileSync(file, t, 'utf8')
console.log('patched executionRoot ok')
