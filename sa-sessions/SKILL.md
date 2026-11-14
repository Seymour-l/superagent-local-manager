---
name: sa-sessions
description: Super Agent 的全局会话读取工具。查看本机所有 DSH 会话（QQ、B站大肥鱼、桌面等）的标题、时间与完整对话内容，搜索历史消息。只读，不写任何会话。
---

# sa-sessions — 全局会话读取

你是 Super Agent（更高层管理者），有权查看本机**所有** DSH 会话的内容。本 skill 提供只读访问。

## 环境

- Node：`C:\Users\lenovo\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`（v24，自带 zstd）
- 脚本：`C:\Users\lenovo\.dsh\skills\sa-sessions\scripts\sa-sessions.mjs`
- 数据源：`~/.dsh/sessions/<workspace-key>/<session-id>/session.v4.jsonl.zstd`（多帧 zstd，绝不写入）

## 命令

```
node sa-sessions.mjs list                 # 每个会话一行 JSON：id、工作区、标题、消息数、起止时间
node sa-sessions.mjs read <id>            # 一个会话的用户/助手正文（默认跳过系统注入）
node sa-sessions.mjs read <id> --json     # JSONL 输出，便于程序处理
node sa-sessions.mjs read <id> --all      # 包含系统注入消息（runtime context 等）
node sa-sessions.mjs read <id> --limit 50 # 只取前 50 条
node sa-sessions.mjs recent 3             # 最近 3 天全部会话的消息（JSONL）
node sa-sessions.mjs search "关键词"       # 全部会话中搜消息正文
```

`<id>` 可用完整 session id 或去掉 `session-` 前缀的 uuid。

## 输出字段

`list`：`{id, dir, workspace, cwd, preset, title, titleSource, humanMessages, assistantMessages, createdAt, lastAt}`

`read/recent/search` 的消息：`{session, workspace, seq, time, role, source, model, text}`

## 注意

- 工作区标识：`--C-Users-lenovo-.dsh-qqbot-workspace--` = QQ 大肥鱼；`--C-Users-lenovo-.dsh-whale-work--` 下的 `bili-whale` = B站大肥鱼；`default-workspace` = 主桌面。
- 只读。任何对会话日志的写入都禁止。
- 大会话输出可能很长，先 `list` 再 `read --limit`。
