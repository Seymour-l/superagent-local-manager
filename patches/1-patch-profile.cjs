const fs = require('node:fs')
const p = 'C:/Users/lenovo/.dsh/profiles/desktop/cordis.patch.yml'
let t = fs.readFileSync(p, 'utf8')
const i = t.indexOf('# --- dsh-superagent')
if (i < 0) throw new Error('superagent section not found')
const marker = '# --- dsh-superagent (Super Agent 管理者版) ---'
if (t.includes(marker)) { console.log('already applied'); process.exit(0) }
const oldSection = `# --- dsh-superagent (inbox 版) ---
- id: dsh-superagent
  name: dsh-superagent-inbox
  config:
    stateDir: /Users/lenovo/.dsh/superagent-state
- id: dsh-superagent-github
  name: dsh-superagent-inbox/github-watch
  disabled: true
- id: dsh-superagent-inbox
  name: dsh-superagent-inbox/inbox-watch
  disabled: false
  config:
    root: /Users/lenovo/.dsh/superagent-inbox
    agentName: dsh-superagent
    conversations:
      - id: ops
        listen: all
    pollSeconds: 30`
const newSection = `# --- dsh-superagent (Super Agent 管理者版) ---
- id: dsh-superagent
  name: dsh-superagent-inbox
  config:
    stateDir: C:/Users/lenovo/.dsh/superagent-state
- id: dsh-superagent-github
  name: dsh-superagent-inbox/github-watch
  disabled: true
- id: dsh-superagent-inbox
  name: dsh-superagent-inbox/inbox-watch
  disabled: false
  config:
    root: C:/Users/lenovo/.dsh/superagent-inbox
    agentName: dsh-superagent
    conversations:
      - id: ops
        listen: all
      - id: qq
        listen: all
      - id: bili
        listen: all
    pollSeconds: 15
# Super Agent 的主 Session 专属技能：全局会话读取（只读）
- id: dsh-superagent-main-skills
  name: '@deepseek-ai/dsh-skill-filesystem'
  config:
    skills:
      - id: sa-sessions
        path: C:/Users/lenovo/.dsh/skills/sa-sessions
# QQ 侧会话也挂载同一技能与共享记忆目录
- id: qqbot-skills
  name: '@deepseek-ai/dsh-skill-filesystem'
  config:
    skills:
      - id: sa-sessions
        path: C:/Users/lenovo/.dsh/skills/sa-sessions`
if (!t.includes(oldSection)) throw new Error('old superagent section mismatch; aborting')
t = t.replace(oldSection, newSection)
fs.writeFileSync(p, t, 'utf8')
console.log('patched ok')
