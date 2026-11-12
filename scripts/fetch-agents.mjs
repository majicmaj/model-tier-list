#!/usr/bin/env node
// Fetch the Artificial Analysis coding-agents page, pull harness+model run
// records from the embedded page payloads, download maker logos, and write
// one typed snapshot that the app reads. Run: pnpm fetch:agents
import {
  downloadLogos,
  extractBalanced,
  fetchFlightText,
  logoName,
  num,
  originPath,
  priorAdded,
  titleCase,
  writeSnapshot,
} from './lib/aa.mjs'

const SRC = 'https://artificialanalysis.ai/agents/coding-agents'

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

function addMaker(companies, logoFiles, m, fallback) {
  const logoPath = m.logo || null
  const file = logoName(logoPath)
  if (logoPath && file && !logoFiles.has(file)) logoFiles.set(file, originPath(logoPath))
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

/** One page row becomes one harness+model run. */
function toRun(r, ctx) {
  const { companies, logoFiles, slugs, missing, prior, today } = ctx
  const key = addMaker(companies, logoFiles, r.agentCreator || {}, r.provider)
  const modelMakers = []
  for (const m of r.modelCreators || []) {
    const k = addMaker(companies, logoFiles, m, null)
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
  return {
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
  }
}

async function main() {
  const text = await fetchFlightText(SRC)

  // Row objects stream both inside the rows array and as single flight
  // records. Collect every unique id; each id is one harness+model run.
  const rowRe =
    /\{"id":"[0-9a-f]{32}","isDefault":(?:true|false),"isHighlighted":(?:true|false),"agentName":"(?:[^"\\]|\\.)*"/g
  const seen = new Map()
  let m
  while ((m = rowRe.exec(text))) {
    try {
      const obj = JSON.parse(extractBalanced(text, m.index, '{', '}'))
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

  const ctx = {
    companies: {},
    logoFiles: new Map(),
    slugs: new Set(),
    missing: { intelligence: 0, price: 0, latency: 0, speed: 0 },
    prior: priorAdded('agents.json'),
    today: new Date().toISOString().slice(0, 10),
  }
  const models = records.map((r) => toRun(r, ctx))

  // Rank by score for a stable snapshot order.
  models.sort((a, b) => (b.intelligence ?? -1) - (a.intelligence ?? -1))

  const logoOk = await downloadLogos(ctx.logoFiles)

  writeSnapshot('agents.json', {
    edition: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: SRC,
    priceField: 'meanCostUsd',
    models,
    companies: ctx.companies,
  })

  console.log('harnesses:', models.length)
  console.log('makers:', Object.keys(ctx.companies).length)
  console.log('logos saved:', logoOk, '/', ctx.logoFiles.size)
  console.log('missing values:', JSON.stringify(ctx.missing))
}

main().catch((err) => {
  console.error('fetch failed:', err.message)
  process.exit(1)
})
