#!/usr/bin/env node
// Fetch the Artificial Analysis coding-agents page, pull harness+model run
// records from the embedded page payloads, download maker logos, and write
// one typed snapshot that the app reads. Run: pnpm fetch:agents
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = 'https://artificialanalysis.ai/agents/coding-agents'

/** First-seen dates carried from the previous snapshot, keyed by slug. */
function priorAdded() {
  const p = join(ROOT, 'src', 'data', 'agents.json')
  if (!existsSync(p)) return new Map()
  try {
    return new Map(JSON.parse(readFileSync(p, 'utf8')).models.map((m) => [m.slug, m.added]))
  } catch {
    return new Map()
  }
}
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const titleCase = (s) =>
  s
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

/** Collapse JS-string escape levels until the text stops changing. */
function unescapeFully(s) {
  let prev = s
  for (let i = 0; i < 8; i++) {
    const next = prev.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
    if (next === prev) return next
    prev = next
  }
  return prev
}

/** Extract a balanced {...} object starting at the given index. Honors JSON strings. */
function extractObject(text, start) {
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error('Unbalanced object in payload')
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Drop baked tile grounds so logos sit clean on tinted tiles: a leading
 * full-bleed light rect, plus opencode's pair of full-bleed ground paths.
 * Dark grounds that carry the mark (spacexai, xiaomi, zai) stay untouched.
 */
function sanitizeSvg(svg) {
  let out = svg.replace(
    /<svg([^>]*)>\s*<rect\s+width="(48|100%)"\s+height="(48|100%)"[^>]*fill="(white|#fff(?:fff)?|#[Ff]0[Ee][Ff][Ee][Aa])"[^>]*\/>\s*/,
    '<svg$1>',
  )
  out = out.replace(/<path d="M43 0H5V48H43V0Z" fill="(?:black|white)"\/>\s*/g, '')
  return out
}

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Drop AA fallback-chain noise from model labels. */
const cleanModel = (s) =>
  String(s || '')
    .replace(/,?\s*default fallback/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()

async function main() {
  console.log('GET', SRC)
  const res = await fetch(SRC, { headers: { 'user-agent': UA, accept: 'text/html' } })
  if (!res.ok) throw new Error(`Page fetch failed: ${res.status}`)
  const html = await res.text()
  console.log('html bytes:', html.length)

  const marker = 'self.__next_f.push([1,"'
  const parts = []
  let from = 0
  while (true) {
    const i = html.indexOf(marker, from)
    if (i < 0) break
    const end = html.indexOf('</script>', i)
    if (end < 0) break
    parts.push(html.slice(i + marker.length, end - 2))
    from = end
  }
  console.log('flight payloads:', parts.length)
  if (!parts.length) throw new Error('No flight payloads found; page shape changed')

  const text = unescapeFully(parts.join('\n'))

  // Row objects stream both inside the rows array and as single flight
  // records. Collect every unique id; each id is one harness+model run.
  const rowRe =
    /\{"id":"[0-9a-f]{32}","isDefault":(?:true|false),"isHighlighted":(?:true|false),"agentName":"(?:[^"\\]|\\.)*"/g
  const seen = new Map()
  let m
  while ((m = rowRe.exec(text))) {
    try {
      const obj = JSON.parse(extractObject(text, m.index))
      if (obj.agentName && obj.agentName !== 'Agent Name' && !seen.has(obj.id)) {
        seen.set(obj.id, obj)
      }
    } catch {
      // Partial record at a chunk edge; the full copy streams elsewhere.
    }
  }
  const records = [...seen.values()]
  console.log('harness records:', records.length)
  if (!records.length) throw new Error('No harness rows found; page shape changed')

  const logoName = (logo) => {
    if (!logo) return null
    let p = logo
    const nx = p.match(/\/_next\/image\?url=([^&]*)/)
    if (nx) p = decodeURIComponent(nx[1])
    return p.split('/').pop() || null
  }

  const models = []
  const companies = {}
  const logoFiles = new Map() // file -> origin path
  const slugs = new Set()
  const missing = { intelligence: 0, price: 0, latency: 0, speed: 0 }
  const prior = priorAdded()
  const today = new Date().toISOString().slice(0, 10)

  const addMaker = (m, fallback) => {
    const logoPath = m.logo || null
    const file = logoName(logoPath)
    if (logoPath && file && !logoFiles.has(file)) {
      let p = logoPath
      const nx = p.match(/\/_next\/image\?url=([^&]*)/)
      if (nx) p = decodeURIComponent(nx[1])
      logoFiles.set(file, p)
    }
    const key = String(m.slug || fallback || 'unknown').toLowerCase()
    if (!companies[key]) {
      companies[key] = {
        name: m.name || titleCase(key),
        logo: file ? `/logos/${file}` : null,
        color: m.color || null,
      }
    } else {
      const co = companies[key]
      if (!co.color) co.color = m.color || null
      if (!co.logo && file) co.logo = `/logos/${file}`
    }
    return key
  }

  for (const r of records) {
    const maker = r.agentCreator || {}
    const key = addMaker(maker, r.provider)
    const modelMakers = []
    for (const m of r.modelCreators || []) {
      const k = addMaker(m, null)
      if (!modelMakers.includes(k)) modelMakers.push(k)
    }
    const mean = r.mean || {}
    const v = {
      intelligence: num(r.indexScore),
      price: num(mean.costUsd),
      latency: num(mean.agentWallTimeSec),
      speed: num(mean.steps),
    }
    for (const k of Object.keys(missing)) if (v[k] === null) missing[k]++
    const model = cleanModel(r.display?.model || '')
    const vers = r.versions || {}
    const version =
      Object.values(vers)
        .map((e) => e?.max?.version)
        .find(Boolean) || null
    let slug = slugify(`${r.agentName} ${model}`) || r.id
    if (slugs.has(slug)) slug = `${slug}-${r.id.slice(0, 6)}`
    slugs.add(slug)
    models.push({
      slug,
      name: r.agentName,
      shortName: model || r.agentName,
      added: prior.get(slug) || today,
      version,
      modelLabel: model || null,
      modelMakers,
      company: key,
      url: SRC,
      releaseDate: null,
      reasoning: false,
      openWeights: false,
      ...v,
      context: null,
      value: null,
    })
  }

  // Rank by score for a stable snapshot order.
  models.sort((a, b) => (b.intelligence ?? -1) - (a.intelligence ?? -1))

  // Download logos (shared public/logos pool with the models snapshot).
  const logoDir = join(ROOT, 'public', 'logos')
  mkdirSync(logoDir, { recursive: true })
  let logoOk = 0
  for (const [file, path] of logoFiles) {
    const url = path.startsWith('http') ? path : `https://artificialanalysis.ai${path}`
    try {
      const lr = await fetch(url, { headers: { 'user-agent': UA } })
      if (!lr.ok) throw new Error(String(lr.status))
      const buf = Buffer.from(await lr.arrayBuffer())
      const body = file.endsWith('.svg') ? sanitizeSvg(buf.toString('utf8')) : buf
      writeFileSync(join(logoDir, file), body)
      logoOk++
    } catch (err) {
      console.warn('logo skip:', file, String(err.message || err))
    }
  }

  const snapshot = {
    edition: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: SRC,
    priceField: 'meanCostUsd',
    models,
    companies,
  }
  const outPath = join(ROOT, 'src', 'data', 'agents.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n')

  console.log('harnesses:', models.length)
  console.log('makers:', Object.keys(companies).length)
  console.log('logos saved:', logoOk, '/', logoFiles.size)
  console.log('missing values:', JSON.stringify(missing))
  console.log('wrote', outPath)
}

main().catch((err) => {
  console.error('fetch failed:', err.message)
  process.exit(1)
})
