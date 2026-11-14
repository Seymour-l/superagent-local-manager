const fs = require('node:fs')
const file = 'C:/Users/lenovo/.dsh/profiles/desktop/node_modules/dsh-superagent-inbox/lib/index.js'
let t = fs.readFileSync(file, 'utf8')
if (t.includes('Super Agent 管理者模式：restrict')) { console.log('already patched'); process.exit(0) }
// 1) WORK_TOOLS：去掉 'bash'（Windows 宿主只有 pwsh）
const old1 = '\t"read_image",\n\t"glob",\n\t"grep",\n\t"bash",\n\t"pwsh",'
if (!t.includes(old1)) { console.error('WORK_TOOLS block not found'); process.exit(1) }
const neu1 = '\t"read_image",\n\t"glob",\n\t"grep",\n\t"pwsh", /* Super Agent 管理者模式：restrict（无 bash） */'
t = t.replace(old1, neu1)
// 2) tools.restrict allow 列表里的 'bash'
const old2 = '"skill",\n\t\t\t"bash",\n\t\t\t"read",'
if (t.includes(old2)) {
  t = t.replace(old2, '"skill",\n\t\t\t"pwsh",\n\t\t\t"read",')
  console.log('restrict list patched')
} else console.log('restrict list pattern differs; skip')
// 3) noWait guard：把 name === 'bash' 分支扩展 pwsh
const old3 = '\tif (name === "bash") {'
if (t.includes(old3)) t = t.replace(old3, '\tif (name === "bash" || name === "pwsh") {')
fs.writeFileSync(file, t, 'utf8')
console.log('patched index.js ok')
