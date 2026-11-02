#!/usr/bin/env node
// Fetch the Artificial Analysis models page, pull model records from the
// embedded page payloads, download company logos, and write one typed
// snapshot that the app reads. Run: pnpm fetch
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = 'https://artificialanalysis.ai/models'
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

/** Extract a balanced [...] array starting at the given index. Honors JSON strings. */
function extractArray(text, start) {
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
    else if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error('Unbalanced array in payload')
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

  // Full model records.
  const keyIdx = text.indexOf('"initialModels"')
  if (keyIdx < 0) throw new Error('initialModels block missing; page shape changed')
  const arrStart = text.indexOf('[', keyIdx)
  const records = JSON.parse(extractArray(text, arrStart))
  console.log('model records:', records.length)

  // Chart entries carry official color + logo + page url per label.
  const chartRe =
    /\{"id":"[0-9a-f-]{36}","label":"((?:[^"\\]|\\.)*)","color":"(#[0-9a-fA-F]{6})","logo":"((?:[^"\\]|\\.)*)","url":"(\/models\/[^"]*)"/g
  const charts = []
  let m
  while ((m = chartRe.exec(text))) {
    charts.push({ label: m[1], color: m[2], logo: m[3], url: m[4] })
  }
  console.log('chart entries:', charts.length)

  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
  const byUrl = new Map()
  const byLabel = new Map()
  for (const c of charts) {
    const slug = c.url.split('/').pop()
    if (!byUrl.has(slug)) byUrl.set(slug, c)
    const k = norm(c.label)
    if (!byLabel.has(k)) byLabel.set(k, c)
  }

  const logoName = (logo) => {
    if (!logo) return null
    let p = logo
    const nx = p.match(/\/_next\/image\?url=([^&]*)/)
    if (nx) p = decodeURIComponent(nx[1])
    return p.split('/').pop() || null
  }
  const companyKey = (file) => (file ? file.replace(/\.[a-z0-9]+$/i, '').toLowerCase() : 'unknown')

  const models = []
  const companies = {}
  const logoFiles = new Map() // file -> origin path
  const unmapped = new Set()
  const missing = { intelligence: 0, speed: 0, price: 0, latency: 0, context: 0, value: 0 }

  for (const r of records) {
    const chart =
      byUrl.get(r.slug) || byUrl.get(r.release?.slug) || byLabel.get(norm(r.name)) || null
    const c = r.creator || {}
    const logoPath = c.logo || chart?.logo || null
    const file = logoName(logoPath)
    if (logoPath) {
      let p = logoPath
      const nx = p.match(/\/_next\/image\?url=([^&]*)/)
      if (nx) p = decodeURIComponent(nx[1])
      if (file && !logoFiles.has(file)) logoFiles.set(file, p)
    }
    const key = String(c.slug || companyKey(file) || 'unknown').toLowerCase()
    const pbp = r.performanceByPromptType || {}
    const speed = num(
      r.timescaleData?.medianOutputSpeed ??
        pbp.long?.medianOutputSpeed ??
        pbp.medium?.medianOutputSpeed ??
        null,
    )
    const latency = num(
      r.timescaleData?.medianTimeToFirstChunk ??
        pbp.long?.medianTimeToFirstChunk ??
        pbp.medium?.medianTimeToFirstChunk ??
        null,
    )
    const value = num(r.intelligenceIndexCostPerTask?.cost?.total ?? null)
    const v = {
      intelligence: num(r.intelligenceIndex),
      speed,
      price: num(r.price1mBlended0To3To1),
      latency,
      context: num(r.contextWindowTokens),
      value,
    }
    for (const k of Object.keys(missing)) if (v[k] === null) missing[k]++
    if (!c.name) unmapped.add(key)
    if (!companies[key]) {
      companies[key] = {
        name: c.name || titleCase(key),
        logo: file ? `/logos/${file}` : null,
        color: c.color || chart?.color || null,
      }
    } else {
      const co = companies[key]
      if (!co.color) co.color = c.color || chart?.color || null
      if (!co.logo && file) co.logo = `/logos/${file}`
    }
    models.push({
      slug: r.slug,
      name: r.name,
      shortName: r.shortName || r.name,
      company: key,
      url: `https://artificialanalysis.ai/models/${r.slug}`,
      releaseDate: r.releaseDate || null,
      reasoning: r.isReasoning === true,
      openWeights: r.isOpenWeights === true,
      ...v,
    })
  }

  // Rank by intelligence for a stable snapshot order.
  models.sort((a, b) => (b.intelligence ?? -1) - (a.intelligence ?? -1))

  // Download logos.
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
    priceField: 'price1mBlended0To3To1',
    models,
    companies,
  }
  const outPath = join(ROOT, 'src', 'data', 'snapshot.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n')

  console.log('models:', models.length)
  console.log('companies:', Object.keys(companies).length)
  console.log('logos saved:', logoOk, '/', logoFiles.size)
  console.log('missing values:', JSON.stringify(missing))
  if (unmapped.size) console.log('nameless companies:', [...unmapped].sort().join(', '))
  console.log('wrote', outPath)
}

main().catch((err) => {
  console.error('fetch failed:', err.message)
  process.exit(1)
})
