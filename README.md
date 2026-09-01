# Coinflow Merchant Console

A redesign of the admin dashboard, purchases table, customers table and both
detail drawers. React + Vite + TypeScript + Tailwind, shadcn-style components on
Radix. The API is mocked, so there is no backend to run.

## Running it

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build
pnpm check    # typecheck plus the design-system checks below
pnpm lint
```

## What's built

| Page | Notes |
| --- | --- |
| Overview | KPIs, payments and payouts charts, card and merchant breakdowns |
| Purchases | 13 columns, filters, sorting, pagination, payment drawer |
| Customers | 10 columns by default (4 more optional), filters, sorting, pagination, customer drawer |

Both tables keep the same columns in the same order as the current product, so
the pages should be recognisable. The other nav items are placeholders.

## Design notes

**Colour means one thing.** Green is settled, amber is in flight, red is failed,
blue is informational, grey is the default. Violet is only ever used for things
you can interact with, never for a status. Everything resolves through tokens in
`src/index.css`; no component uses a raw Tailwind colour.

**Badges mark exceptions, not every value.** A field at its normal value renders
a dash instead of a badge. The original Customers table had six columns of green
"Enabled" and "Standard" pills on nearly every row, which made the exceptions
hard to spot. Same data, same columns, but only the unusual values are coloured.

**Density.** Tables default to compact rows with a toggle for comfortable. This
is a tool people have open all day.

**Type and spacing** come from a fixed scale. `pnpm check` fails the build if a
component uses a size outside it, or if any text drops below WCAG AA contrast.

## Structure

```
src/
  components/   shared UI, tables, charts, icons
  features/     home, purchases, customers
  lib/          formatting, tone registry, glossary
  mocks/        seeded fixtures and the fake API
  stores/       zustand stores for table and drawer state
```

Table state (search, filters, sort, page) lives in a store scoped per table
rather than in the page, because the toolbar, table and pagination all need it
and none of them is a parent of the others.

Fixtures are generated from a seed, so the data is the same on every reload.

