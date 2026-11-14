#!/usr/bin/env node
/**
 * sa-sessions.mjs — Super Agent 会话读取工具（只读）
 *
 * 读取 ~/.dsh/sessions 下所有 DSH 会话日志（多帧 zstd）。
 *
 * 事件格式（DSH v4）：每行 JSON，形如
 *   {type:'session', id, createdAt, cwd, agentPreset}
 *   {type:'user/message', seq, time, data:{content:[{type:'text',text}], source:{kind}, role}}
 *   {type:'assistant/message', seq, time, data:{content:[...], model?}}
 *   {type:'session/title', data:{title, source:{kind}}}
 *
 * 用法:
 *   node sa-sessions.mjs list              # 每个会话一行 JSON：id/工作区/标题/起止/消息数
 *   node sa-sessions.mjs read <id> [--json] [--limit N]  # 会话消息（默认用户+助手正文）
 *   node sa-sessions.mjs recent [days]     # 最近 N 天所有会话的用户/助手消息（JSONL）
 *   node sa-sessions.mjs search <regex>    # 全会话搜消息正文
 *
 * 只读，绝不写日志。跳过 source.kind 非 'user' 的注入消息（runtime context、
 * skill 清单、mnemon 快照等），read --all 可包含。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

const ZSTD_MAGIC = 0xfd2fb528
const LOG_NAME = 'session.v4.jsonl.zstd'
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const SESSIONS_ROOT = path.join(DSH_HOME, 'sessions')

/** 解码多帧 zstd 日志。逐帧二分定位帧尾（node 无 zstd 帧边界 API）。 */
function decodeLog(buf) {
  const out = []
  const b = Buffer.from(buf)
  let off = 0
  let guard = 0
  while (off < b.length && guard++ < 1_000_000) {
    if (b.length - off < 5 || b.readUInt32LE(off) !== ZSTD_MAGIC) break
    // 先试整个尾部（多帧时 zstdDecompressSync 只解第一帧？不——它要求恰一帧才对
    // 尾部含多帧会抛错，因此二分找最小 end 使子区间恰为一帧）。
    let lo = off + 5, hi = b.length, found = null
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      try { zlib.zstdDecompressSync(b.subarray(off, mid)); found = mid; hi = mid - 1 } catch { lo = mid + 1 }
    }
    if (!found) break
    out.push(zlib.zstdDecompressSync(b.subarray(off, found)).toString('utf8'))
    off = found
  }
  return out.join('\n')
}

function findLogs() {
  const list = []
  if (!fs.existsSync(SESSIONS_ROOT)) return list
  for (const ws of fs.readdirSync(SESSIONS_ROOT)) {
    const wsDir = path.join(SESSIONS_ROOT, ws)
    try { if (!fs.statSync(wsDir).isDirectory()) continue } catch { continue }
    for (const entry of fs.readdirSync(wsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const log = path.join(wsDir, entry.name, LOG_NAME)
      if (fs.existsSync(log)) list.push({ id: entry.name, ws, log })
    }
  }
  return list
}

function parseLog(log) {
  let plain
  try { plain = decodeLog(fs.readFileSync(log)) } catch (e) { return { error: String(e), events: [] } }
  const events = []
  for (const line of plain.split('\n')) {
    const t = line.trim()
    if (!t) continue
    try { events.push(JSON.parse(t)) } catch { }
  }
  return { events }
}

function textOf(e) {
  const c = e.data?.content
  if (!Array.isArray(c)) return ''
  return c.filter(p => p?.type === 'text' || typeof p === 'string').map(p => typeof p === 'string' ? p : p.text).join('\n')
}

function isHumanUser(e) {
  const k = e.data?.source?.kind
  return k === undefined || k === 'user' || k === 'dsh-mnemon-user' ? k === 'user' || k === undefined : false
}

/** 会话级摘要 */
function summarize(info) {
  const { events } = parseLog(info.log)
  let title = null, titleSource = null, created = null, last = null, users = 0, assistants = 0, cwd = null, preset = null
  for (const e of events) {
    if (e.type === 'session') { created = e.createdAt; cwd = e.cwd; preset = e.agentPreset }
    if (e.type === 'session/title') { title = e.data?.title ?? title; titleSource = e.data?.source?.kind ?? titleSource }
    if (e.type === 'user/message' && e.data?.source?.kind === 'user') users++
    if (e.type === 'assistant/message') assistants++
    if (e.time) last = e.time
  }
  return {
    id: info.id.replace(/^session-/, ''), dir: info.id, workspace: info.ws, cwd, preset,
    title, titleSource, humanMessages: users, assistantMessages: assistants,
    createdAt: created ? new Date(created).toISOString() : null,
    lastAt: last ? new Date(last).toISOString() : null,
  }
}

function sessionMessages(info, { includeInjected = false } = {}) {
  const { events } = parseLog(info.log)
  const msgs = []
  for (const e of events) {
    if (e.type !== 'user/message' && e.type !== 'assistant/message') continue
    const kind = e.data?.source?.kind
    if (e.type === 'user/message' && !includeInjected && kind !== 'user' && kind !== undefined) continue
    if (e.type === 'user/message' && !includeInjected && e.data?.role && e.data.role !== 'user') continue
    const text = textOf(e)
    if (!text) continue
    msgs.push({
      session: info.id.replace(/^session-/, ''), workspace: info.ws,
      seq: e.seq, time: e.time ? new Date(e.time).toISOString() : null,
      role: e.type === 'user/message' ? 'user' : 'assistant',
      source: kind ?? null,
      model: e.data?.model ? (e.data.model.provider + '/' + e.data.model.model) : null,
      text,
    })
  }
  return msgs
}

const argv = process.argv.slice(2)
const cmd = argv[0] ?? 'list'

if (cmd === 'list') {
  for (const info of findLogs()) console.log(JSON.stringify(summarize(info)))
} else if (cmd === 'read') {
  const target = argv[1]
  const asJson = argv.includes('--json')
  const all = argv.includes('--all')
  const limit = Number(argv.find((a, i) => argv[i - 1] === '--limit')) || Infinity
  const info = findLogs().find(l => l.id === target || l.id === 'session-' + target || l.id.replace(/^session-/, '') === target)
  if (!info) { console.error('no such session: ' + target); process.exit(1) }
  const msgs = sessionMessages(info, { includeInjected: all }).slice(0, limit)
  if (asJson) for (const m of msgs) console.log(JSON.stringify(m))
  else for (const m of msgs) {
    console.log(`\n--- [${m.seq}] ${m.role}${m.model ? ' (' + m.model + ')' : ''} ${m.time ?? ''} ---`)
    console.log(m.text.length > 4000 ? m.text.slice(0, 4000) + '\n…[截断]' : m.text)
  }
} else if (cmd === 'recent') {
  const days = Number(argv[1] ?? 2)
  const cutoff = Date.now() - days * 86400_000
  for (const info of findLogs()) {
    try { if (fs.statSync(info.log).mtimeMs < cutoff) continue } catch { continue }
    for (const m of sessionMessages(info)) console.log(JSON.stringify(m))
  }
} else if (cmd === 'search') {
  const re = new RegExp(argv[1] ?? '.', 'i')
  for (const info of findLogs()) {
    for (const m of sessionMessages(info)) if (re.test(m.text)) console.log(JSON.stringify({ ...m, text: m.text.slice(0, 2000) }))
  }
} else {
  console.error('usage: list | read <id> [--json] [--all] [--limit N] | recent [days] | search <regex>')
  process.exit(1)
}
