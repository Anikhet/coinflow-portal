# Coinflow Merchant Console — redesign

A redesign of the Coinflow admin dashboard, purchases table, customers table and
their detail drawers. React + Vite + TypeScript + Tailwind v4, shadcn-style
primitives on Radix, mocked API.

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm build

pnpm check            # typecheck + design-scale + colour guards
pnpm check:scale      # fails on off-scale type or spacing
pnpm check:contrast   # fails on sub-AA contrast or brand/status collision
pnpm test             # unit tests over the logic modules
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

- Those six customer columns **stay exactly where they are**, but each mapper
  marks its majority value as the default, so a normal customer renders six
  em-dashes instead of six near-identical green pills. On a full page the two or
  three customers with a real problem are the only things carrying colour. The
  redesign's extra columns (lifetime volume, payment count, distinct IPs, KYC)
  are defined but hidden by default and available from the column menu —
  additions should be opt-in, not a silent change to the default view.
- **Protection inverts polarity.** Two thirds of payments *are* protected (67%
  overall; 73% of payments that didn't fail), so "Protected" is the
  boring majority and drawing it as a pill would refill the column with noise.
  The default here is the *good* state; only the absence or refusal of
  protection earns ink.

### 3. One scale, enforced

Swiss method, not Swiss styling. The International Typographic Style has two
separable halves: a *look* (Helvetica, an accent red, poster whitespace) and a
*method* — decide a system once, then never pick a number by feel again.

The look would damage this product. Helvetica's closed apertures blur `c`/`o`
at small sizes and its `I`, `l` and `1` are near-identical — a correctness
hazard in a console that is mostly IDs, last-4s, response codes and Solana
hashes read at 11–13px. Inter exists specifically to fix that. A Swiss accent
red would collide with red-means-failed. And poster whitespace is the opposite
of what an operator reading this for eight hours needs.

The method is worth everything. Type had accumulated **twelve sizes**, including
three pairs no reader can distinguish — 14 against 15, 17 against 18, 24
against 26. Nobody chose those splits; they came from building components in
different sittings. There is now one closed scale, declared in `index.css`, with
Tailwind's own sizes cleared so the names mean these values and nothing else:

```
text-xs    11px   table headers, pill labels, meta
text-sm    12px   secondary and supporting text
text-base  13px   body, table cells — the default
text-lg    15px   page title, card and section headings
text-xl    18px   section totals, record titles
text-2xl   26px   KPI figures, the drawer amount
```

Tight at the bottom where dense UI needs fine gradation, opening up at the top
where jumps must read as hierarchy. Spacing is a 2px-based scale on the same
principle.

Crucially the scale is **checked, not documented**: `pnpm check:scale` fails on
any off-scale `text-[Npx]` or spacing step. A convention decays — the next
person needing something "a bit bigger" types `text-[16px]`, nothing objects,
and the twelve sizes come back. The guard caught three off-scale spacing values
the moment it was written. The single sanctioned exception is the processor
monogram, which is lettering fitted to a glyph box rather than UI type.

The consolidation is visually invisible, which is the proof: the pairs it
collapsed were imperceptible, and only the inconsistency was real.

### 4. Density is a feature

This is a tool people live in for eight hours. Rows are **36px compact** by
default with a density toggle. The original's generous whitespace photographs
well and costs a scan-line in production.

---

## What else changed, and why

**Layout** — the shell is pinned to the viewport height, so each page's body is
the scrolling region rather than the document. Page header, toolbar and
paginator stay put; only rows move. Before this the document scrolled, which
meant a table's `overflow-auto` never engaged — there was no scroll container
for the sticky header to stick inside, and the paginator sat ~900px below the
fold.

**Tables** — both tables keep their full production column set in the same order
with the same labels (Purchases: 13, Customers: 10), so an operator moving
between the two doesn't have to re-learn where anything lives. What changed is
the encoding inside those columns, not the columns themselves. Sticky header and a frozen first column, so scrolling right to read
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

**Home** — carries the same four sections as production: the Payments and
Payouts charts side by side (each with its own Amount/Count toggle, switching
between two pre-computed datasets so it responds instantly), then Card payments
breakdown and Merchant Payouts. Both breakdowns are part-to-whole views of a
single total, so they render as ranked proportional bars rather than pies — a
ranked bar list compares on a shared baseline and degrades gracefully as slices
grow, where a pie forces angle comparison. Their bars use brand violet at
varying opacity rather than a categorical palette, because these are one
quantity split up, not independent series.

KPI cards gain a delta and a sparkline, because a number with no
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
the chart splits into its own 356KB chunk, leaving a 635KB main bundle
(196KB gzipped).

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
Distributions are weighted, not uniform: the corpus is ~81% settled, matching
real traffic. A table where a fifth of rows were red would have led to tuning
the design against the wrong picture.

---

**Explaining the jargon** — this console is dense with payments vocabulary
("chargeback protection", "3-D Secure", "attempt limit", "authorization rate"),
and the original explained none of it. Every such term now carries a small info
hint whose copy comes from one shared glossary (`lib/glossary.ts`), for the same
reason tones do: "Chargeback protection" appears on two tables and in two
drawers, and four hand-written explanations drift into four different meanings.
Each hint is a real focusable button, not a hover-only icon, so the explanation
is reachable by keyboard and announced to a screen reader.

## Accessibility

Rows are real focus targets — `Tab` to a row, `Enter` or `Space` opens it. The
command palette is fully keyboard-driven (`⌘K`, arrows, `Enter`) and its
autofocus is deliberate: focus belongs inside a modal search on open. Every
icon-only control carries an `aria-label`, `:focus-visible` is styled globally
rather than suppressed, and the em-dash used for default attribute values is
`aria-hidden` behind an accessible name, so a screen reader hears the real state
("Protected", "Not enrolled") instead of "dash".

Both themes are token-defined rather than filter-inverted, so contrast was
tuned, not inherited.

## Scope and trade-offs

Home, Purchases and Customers are built, with both detail drawers. The remaining
nav destinations resolve to an explicit "not part of this prototype" state — a
nav item that leads nowhere reads as a bug; one that says so reads as scope.

Known trade-offs, in the order I'd address them:

- **No row virtualisation.** Pagination caps the DOM at 25 rows, so it isn't
  needed yet. It would be, the moment anyone asks for infinite scroll.
- **The two drawer files are ~380 lines each.** Under my own limit but the
  largest things here; the tab panels are the natural split.
- **No E2E coverage.** Unit tests cover the logic modules (filtering, sorting,
  pagination invariants, formatting); the interaction paths were verified by
  hand in a browser rather than by Playwright.
- **Filter state isn't in the URL.** An operator can't share a link to a
  filtered view, which is the first thing a real support workflow would want.
  The view store is already the single source of truth, so this is a
  serialisation layer over one object rather than a refactor.
- **Export is a stub.** The button is wired to nothing.
