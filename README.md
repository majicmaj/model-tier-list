# Model Tier List

Artificial Analysis model data as a seven-tier board. Six lens chips re-cut the
full board with one tap. Each data refresh prints a dated edition.

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173/ in a browser.

## Refresh data

```sh
pnpm fetch
```

The script pulls the Artificial Analysis models page, reads model records from
the page payloads, downloads company logos to `public/logos`, and writes
`src/data/snapshot.json`. Rebuild or reload to print the new edition.

Lens sources per model:

- Intelligence: AA Intelligence Index (higher wins)
- Speed: median output tokens per second (higher wins)
- Price: blended 3:1 USD per 1M tokens (lower wins)
- Latency: median seconds to first chunk (lower wins)
- Context: context window tokens (higher wins)
- Value: weighted USD per index task (lower wins)

Tiers are score bands in steps of max / 7 with boundaries snapped to nearby score
gaps, lettered S down from the best band. Trailing empty tiers drop. Models
with no score for a lens sit in the unranked row.

## Deploy (Cloudflare Pages)

Build command: `pnpm build`. Output directory: `dist`. No adapter needed; the
app is fully static. After `pnpm fetch`, commit the new snapshot and logos so
the deploy prints the fresh edition.
