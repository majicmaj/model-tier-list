// Shared helpers for the Artificial Analysis fetch scripts: page payload
// reads, balanced JSON cuts, logo pool writes, snapshot writes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

/** First-seen dates carried from the previous snapshot, keyed by slug. */
export function priorAdded(file) {
  const p = join(ROOT, 'src', 'data', file)
  if (!existsSync(p)) return new Map()
  try {
    return new Map(JSON.parse(readFileSync(p, 'utf8')).models.map((m) => [m.slug, m.added]))
  } catch {
    return new Map()
  }
}

export const titleCase = (s) =>
  s
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

/** Collapse JS-string escape levels until the text stops changing. */
export function unescapeFully(s) {
  let prev = s
  for (let i = 0; i < 8; i++) {
    const next = prev.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
    if (next === prev) return next
    prev = next
  }
  return prev
}

/** Cut a balanced [...] or {...} span starting at index. Honors JSON strings. */
export function extractBalanced(text, start, open, close) {
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
    else if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error('Unbalanced span in payload')
}

export function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** First finite number in the chain, or null. */
export function firstNum(...vs) {
  for (const v of vs) {
    const n = num(v)
    if (n !== null) return n
  }
  return null
}

export const logoName = (logo) => {
  if (!logo) return null
  let p = logo
  const nx = p.match(/\/_next\/image\?url=([^&]*)/)
  if (nx) p = decodeURIComponent(nx[1])
  return p.split('/').pop() || null
}

export const originPath = (logo) => {
  const nx = logo.match(/\/_next\/image\?url=([^&]*)/)
  return nx ? decodeURIComponent(nx[1]) : logo
}

export const companyKey = (file) =>
  file ? file.replace(/\.[a-z0-9]+$/i, '').toLowerCase() : 'unknown'

/**
 * Drop baked tile grounds so logos sit clean on tinted tiles: a leading
 * full-bleed light rect, plus opencode's pair of full-bleed ground paths.
 * Dark grounds that carry the mark (spacexai, xiaomi, zai) stay untouched.
 */
export function sanitizeSvg(svg) {
  let out = svg.replace(
    /<svg([^>]*)>\s*<rect\s+width="(48|100%)"\s+height="(48|100%)"[^>]*fill="(white|#fff(?:fff)?|#[Ff]0[Ee][Ff][Ee][Aa])"[^>]*\/>\s*/,
    '<svg$1>',
  )
  out = out.replace(/<path d="M43 0H5V48H43V0Z" fill="(?:black|white)"\/>\s*/g, '')
  return out
}

/** GET the page, join its flight payloads, unescape to plain text. */
export async function fetchFlightText(url) {
  console.log('GET', url)
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } })
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
  return unescapeFully(parts.join('\n'))
}

/** Save each logo file once; warn and skip on failure. Returns save count. */
export async function downloadLogos(logoFiles) {
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
  return logoOk
}

export function writeSnapshot(file, snapshot) {
  const outPath = join(ROOT, 'src', 'data', file)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n')
  console.log('wrote', outPath)
}
