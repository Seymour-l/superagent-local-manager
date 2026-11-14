# SETUP — 从零复刻 Super Agent 本地管理者

环境：Windows 11 + DeepSeek Harness（desktop profile）+ 已安装 `dsh-superagent-inbox`（本地 inbox 版原型）+ Node 24（DSH 自带 runtime 即可）。

## 0. 前置

- DSH desktop 正常运行（默认端口 51969）。
- 插件已安装：`dsh-superagent-inbox`（plugin manager 里可见，允许未激活）。
- 原型的 inbox 版插件依赖 `zod` / `proper-lockfile`，由宿主 peer 提供。

## 1. 建目录

```powershell
ni -ItemType Directory -Force ~\.dsh\superagent-inbox\ops\in, ~\.dsh\superagent-inbox\ops\out
ni -ItemType Directory -Force ~\.dsh\superagent-inbox\qq\in,  ~\.dsh\superagent-inbox\qq\out
ni -ItemType Directory -Force ~\.dsh\superagent-inbox\bili\in,~\.dsh\superagent-inbox\bili\out
ni -ItemType Directory -Force ~\.dsh\superagent-state
ni -ItemType Directory -Force ~\.dsh\skills\sa-sessions\scripts
ni -ItemType Directory -Force ~\.dsh\dafeiyu-shared\memory
```

## 2. 打补丁（本仓库 patches/，按序号顺序执行）

```powershell
$node = "~\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
# 1 号补丁改的是 profile 的 cordis.patch.yml（先备份）
# 2-9 号补丁改的是已安装插件的 lib（pnpm 目录）
# 10-11 号补丁把共享人格挂进 QQ 侧配置
node patches\1-patch-profile.cjs   # 等等——见下
```

> 1 号补丁在本机是基于当时 profile 内容的整段替换；新环境请手动把下面的段落写进
> `~/.dsh/profiles/desktop/cordis.patch.yml`（数组追加）：

```yaml
# --- dsh-superagent (Super Agent 管理者版) ---
- id: dsh-superagent
  name: dsh-superagent-inbox
  config:
    stateDir: C:\Users\<你>\.dsh\superagent-state
- id: dsh-superagent-github
  name: dsh-superagent-inbox/github-watch
  disabled: true
- id: dsh-superagent-inbox
  name: dsh-superagent-inbox/inbox-watch
  disabled: false
  config:
    root: C:\Users\<你>\.dsh\superagent-inbox
    agentName: dsh-superagent
    conversations:
      - id: ops
        listen: all
      - id: qq
        listen: all
      - id: bili
        listen: all
    pollSeconds: 15
```

补丁 2-11 直接跑：

```powershell
2,3,4,5,6,7,8,9,10,11 | ForEach-Object { node "patches\$_-*.cjs" }
```

改完 profile 后需要在 DSH 里重新启用插件（plugin manager 里把 dsh-superagent 关一次再开），让 fiber 重载新 lib。

## 3. 装 skill 与共享人格

```powershell
cp sa-sessions\* ~\.dsh\skills\sa-sessions\ -Recurse     # SKILL.md + scripts/sa-sessions.mjs
cp dafeiyu-shared\* ~\.dsh\dafeiyu-shared\ -Recurse     # persona.md + memory/
```

`sa-sessions` 进全局技能目录后所有 DSH 会话（含 Super Agent 的 worker）都能用它读全部会话日志。

## 4. 配置 Super Agent（管理 API）

API 需要 `x-orchestrator-request: 1` 头 + 同源 `Origin`。

```powershell
# 策略：允许列表 + 管理规则
# eval: auto
# source:inbox: root 指 ~/.dsh/superagent-inbox，conversations 加 qq/bili
```

关键点（用 API 保存，别直接改 db）：

- `PUT settings/policy`：rules 加一条全局管理规则；`sources.inbox.allowed` 放行你自己。
- `PUT settings/eval`：`mode: "auto"`。
- `PUT settings/source:inbox`：值形如 `{enabled: true, config: {root, agentName, conversations, pollSeconds}}`（注意带 `enabled`，revision 从 `GET settings` 或 db `settings-block-revision:source:inbox` 读）。
- `PUT settings/executor`：`directory` 用 Windows 盘符绝对路径（补丁已放宽校验）。

## 5. 点火验证

往 `~\.dsh\superagent-inbox\ops\in\` 丢消息（**UTF-8 无 BOM**）：

```json
{"id":"m-001","from":"你的名字","to":"dsh-superagent","text":"连通性测试：请回复确认。"}
```

PowerShell 的 `Set-Content -Encoding UTF8` 会写 BOM——inbox 会把它记为 unreadable。用 node 写：

```powershell
node -e "require('fs').writeFileSync('in/m-001.json', JSON.stringify({id:'m-001',from:'你',to:'dsh-superagent',text:'测试'}))"
```

等 15 秒：`GET /orchestrator/api/overview` 的 flow 应动，工单建立，回复出现在 `ops/out/`。

## 6. 常见坑

- **fiber failed: stateDir 正则** → 跑补丁 5（放宽 absolute），或 profile 里直接写盘符路径。
- **Workspace path is not fully qualified** → 跑补丁 9（executionRoot 规范化）；旧工单的 directory 是建单时算的，重试无效，stop 后发新消息。
- **unknown global tool "bash"** → 跑补丁 6；重载 fiber。
- **shell 里 git 突然没凭据** → superagent worker 环境会设 `GIT_CONFIG_GLOBAL` 指向自己的隔离配置；宿主 shell 里 `$env:GIT_CONFIG_GLOBAL="$env:USERPROFILE\.gitconfig"` 恢复。
- **升级插件后全部失效** → pnpm 目录被覆盖，重跑补丁 2-11。
