# superagent-local-manager

把 [dsh-superagent](https://github.com/deepseek-ai) 原型（DeepSeek Harness 的 super-agent 插件）改造成**本地管理者**：一个能查看本机所有 DSH 会话、沉淀记忆、接受主人指令并调度会话的高层 agent，同时把「B站大肥鱼 × QQ 大肥鱼」两套 agent 人格整合为同一个体（记忆互通、功能互通）。

> 基于 DeepSeek Harness 0.2.x + `dsh-superagent-inbox` 0.1.1（本地文件 inbox 版原型）改造。研究性质，供同好参考。

## 它能做什么

| 能力 | 实现 |
| --- | --- |
| 查看所有会话 | skill `sa-sessions`：只读解码全部 DSH 会话日志（多帧 zstd），list / read / recent / search |
| 记忆系统 | DSH Mnemon（remember / recall / documents）+ 共享记忆目录 |
| 接令调度 | 本地文件 inbox（ops / qq / bili 三个对话目录），消息 JSON 进 `in/`，回复落 `out/`；评估 auto 模式自动接单，每单一个 worker 会话 |
| 人格整合 | `dafeiyu-shared/persona.md` 唯一身份源 + `dafeiyu-shared/memory/` 两侧互通记忆 |

## 对原型做了什么改动（patches/）

按序号对已安装的 `dsh-superagent-inbox`（pnpm 目录）打补丁，全部是幂等字符串替换：

1. **profile 注册**：`cordis.patch.yml` 里启用 superagent + inbox-watch，注册 ops/qq/bili 三个对话。
2. **去 GitHub 门槛**：原型启动强制要求配置 GitHub 仓库与 CLI；改为无仓库时返回本地部署（`repository: ""`），只跑本地 inbox 来源。
3. **verify 环境豁免**：无 GitHub CLI 时跳过 git 凭据链校验。
4. **write 环境降级**：gh shim 无 CLI 时写占位失败脚本；git 凭据行按需省略。
5. **路径放宽**：`stateDir` 等 schema 从仅 `/^\//` 放宽到接受 Windows 盘符路径。
6. **bash→pwsh**：Windows 宿主没有 bash 全局工具，worker 工具白名单与守卫全部换 pwsh。
7-8. **executor.directory 放宽**：工单目录接受盘符路径。
9. **executionRoot 规范化**：unix 风格 `/Users/...` 在 Windows 上规范化为 `C:\Users\...`，避免宿主 `create({cwd})` 报「Workspace path is not fully qualified」。
10-11. **人格整合**：QQ 两侧（im-qqbot 的 group/direct prompt、napcat-bridge 的 persona）注入共享人格与互通记忆引用。

> 注意：补丁打在 pnpm 安装目录，升级插件会丢失——补丁脚本是幂等的，重跑一遍即可恢复。

## 目录

```
├─ README.md
├─ SETUP.md                  # 从零复刻的完整步骤
├─ SA-MANUAL.md              # Super Agent 自己的手册（它的系统提示参考）
├─ patches/                  # 11 个幂等补丁脚本（node .cjs）
├─ sa-sessions/              # 全局会话读取 skill（装到 ~/.dsh/skills/）
└─ dafeiyu-shared/           # 统一人格 + 互通记忆（装到 ~/.dsh/）
```

## 快速开始

见 [SETUP.md](SETUP.md)。核心流程：装好 DSH 与 `dsh-superagent-inbox` → 依次跑补丁 → 放 skill 与共享目录 → 重启 → 往 `~/.dsh/superagent-inbox/ops/in/` 丢一条消息 JSON 测试。

## License

MIT。原原型（dsh-superagent）为 DeepSeek Harness 团队的 MIT 研究代码，本仓库只含改造层。
