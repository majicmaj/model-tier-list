#!/usr/bin/env node
// Fetch the Artificial Analysis models page, pull model records from the
// embedded page payloads, download company logos, and write one typed
// snapshot that the app reads. Run: pnpm fetch
import {
  companyKey,
  downloadLogos,
  extractBalanced,
  fetchFlightText,
  firstNum,
  logoName,
  num,
  originPath,
  priorAdded,
  priorValues,
  titleCase,
  writeSnapshot,
} from './lib/aa.mjs'

const SRC = 'https://artificialanalysis.ai/models'

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

/** AA marks unpriced models $0; read that as no data, not free. */
const priced = (v) => {
  const n = num(v)
  return n === 0 ? null : n
}

function chartMaps(charts) {
  const byUrl = new Map()
  const byLabel = new Map()
  for (const c of charts) {
    const slug = c.url.split('/').pop()
    if (!byUrl.has(slug)) byUrl.set(slug, c)
    const k = norm(c.label)
    if (!byLabel.has(k)) byLabel.set(k, c)
  }
  return { byUrl, byLabel }
}

function chartFor(byUrl, byLabel, r) {
  return byUrl.get(r.slug) || byUrl.get(r.release?.slug) || byLabel.get(norm(r.name)) || null
}

/** Six lens scores from one page record, first live source per field. */
function modelValues(r) {
  const pbp = r.performanceByPromptType || {}
  const hl = r.headline || {}
  return {
    intelligence: num(r.intelligenceIndex),
    speed: firstNum(
      hl.outputSpeed,
      r.timescaleData?.medianOutputSpeed,
      pbp.long?.medianOutputSpeed,
      pbp.medium?.medianOutputSpeed,
    ),
    price: priced(r.price1mBlended0To3To1),
    latency: firstNum(
      hl.timeToFirstToken,
      r.multiTurn?.timeToFirstToken,
      r.timescaleData?.medianTimeToFirstChunk,
      pbp.long?.medianTimeToFirstChunk,
      pbp.medium?.medianTimeToFirstChunk,
    ),
    context: num(r.contextWindowTokens),
    value: priced(r.intelligenceIndexCostPerTask?.cost?.total ?? null),
  }
}

function queueLogo(logoFiles, logoPath) {
  const file = logoName(logoPath)
  if (logoPath && file && !logoFiles.has(file)) logoFiles.set(file, originPath(logoPath))
  return file
}

function fillCompany(co, c, chart, file) {
  if (!co.color) co.color = c.color || chart?.color || null
  if (!co.logo && file) co.logo = `/logos/${file}`
}

/** Register the maker, queue its logo, return the company key. */
function upsertCompany(ctx, c, chart) {
  const { companies, logoFiles, unmapped } = ctx
  const file = queueLogo(logoFiles, c.logo || chart?.logo || null)
  const key = String(c.slug || companyKey(file) || 'unknown').toLowerCase()
  if (!c.name) unmapped.add(key)
  if (!companies[key]) {
    companies[key] = {
      name: c.name || titleCase(key),
      logo: file ? `/logos/${file}` : null,
      color: c.color || chart?.color || null,
    }
  } else {
    fillCompany(companies[key], c, chart, file)
  }
  return key
}

/** One page record plus its chart entry becomes one snapshot model. */
function toModel(r, ctx) {
  const { byUrl, byLabel, missing, prior, prev, today } = ctx
  const chart = chartFor(byUrl, byLabel, r)
  const key = upsertCompany(ctx, r.creator || {}, chart)
  const v = modelValues(r)
  for (const k of Object.keys(missing)) if (v[k] === null) missing[k]++
  return {
    slug: r.slug,
    name: r.name,
    added: prior.get(r.slug) || today,
    prev: prev.get(r.slug) || null,
    shortName: r.shortName || r.name,
    company: key,
    url: `https://artificialanalysis.ai/models/${r.slug}`,
    releaseDate: r.releaseDate || null,
    reasoning: r.isReasoning === true,
    openWeights: r.isOpenWeights === true,
    ...v,
  }
}

async function main() {
  const text = await fetchFlightText(SRC)

  // Full model records.
  const keyIdx = text.indexOf('"initialModels"')
  if (keyIdx < 0) throw new Error('initialModels block missing; page shape changed')
  const records = JSON.parse(extractBalanced(text, text.indexOf('[', keyIdx), '[', ']'))
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

  const ctx = {
    ...chartMaps(charts),
    logoFiles: new Map(),
    companies: {},
    unmapped: new Set(),
    missing: { intelligence: 0, speed: 0, price: 0, latency: 0, context: 0, value: 0 },
    prior: priorAdded('snapshot.json'),
    prev: priorValues('snapshot.json'),
    today: new Date().toISOString().slice(0, 10),
  }
  const models = records.map((r) => toModel(r, ctx))

  // Rank by intelligence for a stable snapshot order.
  models.sort((a, b) => (b.intelligence ?? -1) - (a.intelligence ?? -1))

  const logoOk = await downloadLogos(ctx.logoFiles)

  writeSnapshot('snapshot.json', {
    edition: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: SRC,
    priceField: 'price1mBlended0To3To1',
    models,
    companies: ctx.companies,
  })

  console.log('models:', models.length)
  console.log('companies:', Object.keys(ctx.companies).length)
  console.log('logos saved:', logoOk, '/', ctx.logoFiles.size)
  console.log('missing values:', JSON.stringify(ctx.missing))
  if (ctx.unmapped.size) console.log('nameless companies:', [...ctx.unmapped].sort().join(', '))
}

main().catch((err) => {
  console.error('fetch failed:', err.message)
  process.exit(1)
})
