# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite plus React plus TypeScript as a static app on Cloudflare Pages. I chose this stack because the host answer is Cloudflare, the app is a client side rank view with no server need, and a static build keeps the fetch script and the deploy simple. The chart library choice follows an npm check during scaffold.

## Users

The requester tracks AI model ranks and wants a fast scan. The user opens the app, reads the top tiers at a glance, taps a metric chip to change the lens, and reruns one fetch script when Artificial Analysis posts fresh data.

## Product Purpose

The app shows Artificial Analysis model data as a tier list. It exists to make model ranks easy to scan. Success means the user sees tiers per metric in seconds and refreshes data with one script run.

## Positioning

Tier buckets plus one tap metric chips plus a one command data refresh. Dense leaderboards show long tables. This app shows tiers first and lets one tap change the full board.

## Operating Context

The user runs the app in a desktop or mobile browser. The app covers six lenses: Intelligence, Speed, Price, Latency, Context Window, and Value. Chips switch the lens and the board re-sorts. A fetch script pulls fresh Artificial Analysis data into one typed snapshot that the app reads.

## Capabilities and Constraints

Confirmed capabilities:

- Tier list groups models by score band for the active lens.
- Metric chips switch between the six lenses.
- Each model row shows the company logo.
- Charts use one unique color per company.
- Colors follow Radix color guidance.
- Components follow shadcn UI patterns.
- Charts follow the bklit TanStack Charts look and feel.
- Motion uses impeccable-animate patterns from impeccable.style.
- One fetch script refreshes the data snapshot.

Decided during build: no public JSON API exists, so the fetch script parses the models page flight payloads (initialModels records plus creator, logo, and color fields) and downloads logos to public/logos.

## Brand Commitments

No product name exists yet. Binding references from the user:

- Artificial Analysis models page as the data source.
- bklit TanStack Charts site as the chart reference.
- shadcn UI as the component reference.
- Radix colors as the color reference.
- impeccable.style plus impeccable-animate as the motion reference.

## Evidence on Hand

- https://artificialanalysis.ai/models (data source, live page).
- https://bklit-tanstack-charts-migration.vercel.app/ (chart reference, live page).
- https://ui.shadcn.com/ (component reference, live page).
- https://impeccable.style/ (motion reference, live page).
- No local logo assets yet. Future work must source real company logos and must not fabricate ranks, scores, or prices.

## Product Principles

- Scan beats scroll: tiers answer first, detail stays one tap away.
- One tap changes the lens: each chip rebuilds the full board.
- Fresh data on demand: one script run refreshes the snapshot.
- No fake ranks: each score shows its source snapshot date.
