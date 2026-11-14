const fs = require('node:fs')
const p = 'C:/Users/lenovo/.dsh/profiles/desktop/cordis.patch.yml'
let t = fs.readFileSync(p, 'utf8')
if (t.includes('dafeiyu-shared')) { console.log('already patched'); process.exit(0) }
// 1) napcat persona 换成共享人格说明
const oldPersona = '    persona: 你是一个得力的 QQ 群聊与私聊智能助手，请友好、精炼、真实地回答用户的问题。'
const newPersona = '    persona: 你是大肥鱼（也叫汐）。完整人格与记忆见 C:\\Users\\lenovo\\.dsh\\dafeiyu-shared\\persona.md——每次会话先读它，以及 C:\\Users\\lenovo\\.dsh\\dafeiyu-shared\\memory\\ 下的共享记忆。你在 QQ 这边的言行与 B站侧是同一条鱼：记忆互通，人格一致。'
if (!t.includes(oldPersona)) { console.error('napcat persona not found'); process.exit(1) }
t = t.replace(oldPersona, newPersona)
// 2) im-qqbot 的 directPrompt/groupPrompt 前插共享人格引用（保留原文本作为人格正文）
const anchor = '    directPrompt: |-\n      # 我是谁'
if (!t.includes(anchor)) { console.error('directPrompt anchor not found'); process.exit(1) }
const shared = '    directPrompt: |-\n      # 共享人格与互通记忆\n\n      本会话与 B站侧是同一条大肥鱼。每次会话先读 C:\\Users\\lenovo\\.dsh\\dafeiyu-shared\\persona.md 和 C:\\Users\\lenovo\\.dsh\\dafeiyu-shared\\memory\\（共享记忆，两边互通）；B站侧另有 whale-diary.md / whale-diary-private.md。重要事实写进共享 memory 目录，注明来源平台。\n\n      # 我是谁'
t = t.replace(anchor, shared)
fs.writeFileSync(p, t, 'utf8')
console.log('patched napcat + qqbot persona links ok')
