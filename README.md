# Coinflow Merchant Console — redesign

A redesign of the Coinflow admin dashboard, purchases table, customers table and
their detail drawers. React + Vite + TypeScript + Tailwind v4, shadcn-style
primitives on Radix, mocked API.

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # 51 unit tests
pnpm coverage   # ~87% statements on logic modules
pnpm build
```

No backend required — the API is mocked in `src/mocks/`.

---

## The design argument

The original screens are dense and complete, but they spend their visual budget
restating that nothing is wrong. Three ideas drive the redesign.

### 1. Colour is information, not decoration

Every colour resolves through a semantic token in `src/index.css`. There are
**zero raw Tailwind palette utilities** (`bg-green-500`, `text-red-600`) in the
component tree — a lint-able invariant, and the reason the UI stays coherent as
it grows.

The token layer has two groups that are deliberately kept apart:

- **Brand violet** — interactive and identity affordances only.
- **Five tones** — `positive`, `caution`, `critical`, `info`, `neutral`.

Because brand violet is excluded from the tone set, a violet element can only
ever mean *"you can interact with this."* It can never be confused for a status.

Green is narrowed further: it appears **only in a status column**. A green pill
anywhere in a row therefore has exactly one meaning — "this settled" — with no
second green competing for the same glance. `src/lib/tone-map.ts` is the single
registry mapping every domain value to a tone, so "settled" is the same green in
the table, the drawer and the activity timeline, and cannot drift.

### 2. Pills are exception markers, not labels

The original's Customers table has six adjacent columns of near-identical green
pills — `Enabled`, `Functional`, `Standard`, `Standard`, `Enforced`, `Standard` —
on virtually every row. Six columns of screen width spent saying "normal".

One `<Pill>` component enforces a closed taxonomy (`src/components/ui/pill.tsx`):

1. **One anatomy.** 20px tall, 6px radius, 11px/500. Size never varies.
2. **One tinted pill per row** — the status. It is the anchor your eye lands on.
3. **Attributes are ghost pills**, visually beneath status so they never compete.
4. **Identity is not a pill.** Method, processor, merchant and card brand render
   as glyph + plain text. They describe what a payment *is*, not how it is
   *doing*; pilling them is the root of the badge-storm.
5. **Defaults render nothing.** A default attribute is a muted em-dash.

Rule 5 is the whole game: because normal rows are quiet, **the presence of a
pill always means "look here."**

Two consequences worth calling out:

- Those six customer columns collapse into one **Exceptions** column that is
  empty for a normal customer. Nothing is lost — it is all in the drawer, and
  filterable — but the table now reads at a glance. The freed width buys
  lifetime volume, payment count and distinct-IP count, which matter far more
  for triage and were missing entirely.
- **Protection inverts polarity.** ~74% of payments *are* protected, so
  "Protected" is the boring majority and drawing it as a pill would refill the
  column with noise. The default here is the *good* state; only the absence or
  refusal of protection earns ink.

### 3. Density is a feature

This is a tool people live in for eight hours. Rows are **36px compact** by
default with a density toggle. The original's generous whitespace photographs
well and costs a scan-line in production.

---

## What else changed, and why

**Tables** — sticky header and a frozen first column, so scrolling right to read
a status never detaches it from the record it belongs to. Row height comes from
the density token, never from content, so a cell with two pills cannot make its
row taller than its neighbours. Skeletons match the real box exactly.

**Sidebar** — the original filed all eleven destinations under one
"PAYMENTS & PAYOUTS" heading and gave five of them a near-identical shield, so
icon shape carried zero information. Now four intent-based groups, and every
icon is a distinct, semantically loaded silhouette (`Unlink` for unmatched
chargebacks, `CornerUpLeft` for ACH returns, `Wrench` for ops). Exactly one
shield survives, so the shield now uniquely identifies one destination.

**Drawers** — both records share one tabbed shell. The original used two
different models (payment: scroll-forever with its five header actions repeated
verbatim at the bottom under "Options"; customer: tabbed with record paging),
forcing operators to learn the product twice. The topographic card render is
kept — it was the one genuinely delightful element, and it makes the drawer
identifiable before any text is read.

**Home** — KPI cards gain a delta and a sparkline, because a number with no
reference point cannot be acted on. Authorization rate is added as a fourth
metric: volume tells you what happened, auth rate tells you whether something is
wrong *right now*. The method chart plotted all ten rails on a shared linear
axis, where Card is an order of magnitude larger and the other nine sit flat on
zero — complete, and unreadable. It is now a **stacked area of the top five plus
"Other"**, which answers the part-to-whole question the chart is actually for.

**Typography** — Inter with tabular figures for UI and currency; IBM Plex Mono
for IDs and hashes, chosen because its slashed zero disambiguates `0`/`O` in a
Solana transaction hash.

---

## Architecture notes

**No prop drilling.** Table view state (search, filters, sort, page, column
visibility) is consumed by three siblings — toolbar, table, pagination — none of
which is an ancestor of the others. Holding it in the page made the page a
message bus for eight values it never used itself. It lives in a **scoped
Zustand store created per table and provided via context**
(`src/stores/table-view-*`), so the two tables cannot collide. The store also
owns the invariant that *any change altering the result set resets to page 1* —
no call site can forget it.

**No `useEffect` for derived state.** The command palette previously used two
effects to reset its query and highlight. Both were the "reset state on change"
anti-pattern. The palette body is now a child that Radix mounts only while open
(so state resets naturally), and the highlight is **clamped during render** —
it can never point past the end of a filtered list, not even for the one frame
an effect would take to fix it. The only remaining effects are genuine external
subscriptions with cleanup: a global keybinding, a theme attribute, and data
fetching with a cancellation flag that prevents out-of-order responses from
overwriting fresher state.

**Three distinct empty states.** A failed request, a filtered-to-nothing result
and a genuinely empty scope look identical to a naive "no rows" implementation
but need different copy and different actions. Showing "no results" on a failed
request is a lie that sends the user hunting through filters for a problem on
our side.

**Bundle** — Recharts is used on one screen but was loaded eagerly, so operators
opening the tables paid for a charting library they never render. Code-split:
main bundle 861KB → 512KB (160KB gzipped).

**CLS** — every async surface reserves its box before paint: fixed-height KPI
cards, a chart with a fixed floor, skeletons matched to real geometry, and the
card visual pinned to the real ISO/IEC 7810 card ratio. Animation is `transform`
and `opacity` only.

---

## Mocked API

`src/mocks/api.ts` stands in for the backend. Every function is async and
artificially latent, so loading and empty states are exercised on every
navigation rather than bolted on at integration time. Filtering, sorting and
pagination run *inside* those functions, mirroring a real paginated endpoint —
swapping the module for `fetch` should require no component changes.

Fixtures are generated by a **seeded PRNG**, so the dataset is byte-identical on
every reload and the edge cases the UI is tuned around don't vanish on refresh.
Distributions are weighted, not uniform: real traffic is ~82% settled, and a
table where a fifth of rows were red would have led to tuning the design against
the wrong picture.

---

## Scope

Home, Purchases and Customers are built, with both detail drawers. The remaining
nav destinations resolve to an explicit "not part of this prototype" state — a
nav item that leads nowhere reads as a bug; one that says so reads as scope.
