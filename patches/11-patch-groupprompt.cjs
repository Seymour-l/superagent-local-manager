const fs = require('node:fs')
const p = 'C:/Users/lenovo/.dsh/profiles/desktop/cordis.patch.yml'
let t = fs.readFileSync(p, 'utf8')
const anchor = '    groupPrompt: |-\n      # 我是谁'
if (!t.includes(anchor)) { console.error('groupPrompt anchor not found'); process.exit(1) }
if (t.includes('groupPrompt: |-\n      # 共享人格与互通记忆')) { console.log('already patched'); process.exit(0) }
const shared = '    groupPrompt: |-\n      # 共享人格与互通记忆\n\n      本会话与 B站侧是同一条大肥鱼。每次会话先读 C:\\Users\\lenovo\\.dsh\\dafeiyu-shared\\persona.md 和 C:\\Users\\lenovo\\.dsh\\dafeiyu-shared\\memory\\（共享记忆，两边互通）；B站侧另有 whale-diary.md / whale-diary-private.md。重要事实写进共享 memory 目录，注明来源平台。\n\n      # 我是谁'
t = t.replace(anchor, shared)
fs.writeFileSync(p, t, 'utf8')
console.log('groupPrompt patched ok')
