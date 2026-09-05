# Maestro — Retail Media CRM

A Retail Media CRM concept built for **Osmos.ai** (for BigBasket), designed as an interactive prototype for a product management case study.

---

## 1. Product Overview

Traditional CRMs depend on sales reps manually logging accounts, opportunities, and activities. But on a retail platform with thousands of brands in the catalogue, rep capacity is inherently bounded: only ~2% of brands ever get carried by human sales teams.

**Maestro** inverts this model: **it generates pipeline directly from platform commerce signals rather than relying on reps to type it in.**

- **North Star Metric:** Conversion rate on generated opportunities — of the brands Maestro surfaced and routed, what share started advertising.
- **Scope Discipline:** To protect V1 delivery, each screen is clearly badged with its delivery phase:

| Screen | Scope Badge | Strategic Role |
|---|---|---|
| **Coverage** | `V1` | Core Hero Radar: Surfaces open opportunities (brand × category × window) across catalogue brands |
| **Brand Detail** | `V1` *(Adjust loop: `Phase 2`)* | Deep-dive signals, two-clocks history, gate line, and live inventory negotiation / handover |
| **Pipeline** | `Phase 4` | Answers the "you were asked for a CRM" question (deliberately post-V1) |
| **Routing** | `Concept` | Proves Maestro decides and conducts rather than executes |

> **Core Concept:** Maestro executes nothing. It decides. Other engines do the work — media planners draft packages, drip engines send offers, self-serve portals book inventory. Maestro determines who fires today, for which brand, based on real platform data.

---

## 2. The Core Logic — Two Calculations, Not One Score

This is **not a GMV ranking**. Anyone can sort a catalogue by GMV; a spreadsheet does that. Maestro answers a different question: *which brands have a genuinely good reason to advertise this week, and what is the reason?*

A small brand can have a great week — its category is spiking, there is unsold inventory in it, and the category returns well. A large brand can have a bad week. The unit of analysis is **brand × category × window**.

### Calculation 1 — Is there a moment? *(per category, per window)*

1. **Gate:** Category ROAS benchmark below floor (`2.0×`) → No moment. The category is excluded entirely. Selling into a category where ads do not work creates a churned advertiser.
2. **Three Factors:**
   - **Demand movement:** Category search volume, trailing 4 weeks vs prior 4 weeks (e.g. `+34%`).
   - **Auction slack:** Room in the category's auction — unsold inventory or high fill with few bidders (e.g. `60% unsold` or `3.2 bidders/slot`).
   - **Return evidence:** Category ROAS benchmark — how strong the return case is (e.g. `3.8×`).
3. **Formula:**
   $$\text{Moment Strength} = \text{Demand Movement} \times \text{Auction Slack} \times \text{Return Evidence}$$
   *(Normalized to 0–100)*.
4. **Multiplicative, not additive:** If any factor is near zero, there is no moment. A search spike with no auction room is nothing. Cheap inventory in a dead category is nothing. Adding factors would let one strong signal mask a fatal weakness.
5. **Floor:** Below ~40, opportunities are not surfaced at all. A short list of unambiguous moments beats 3,000 noisy rows.

### Calculation 2 — How big is the cheque? *(per brand)*

Only computed for brands in categories that have an active moment.

$$\text{Estimated Annual Spend} = \text{Monthly GMV} \times 12 \times \text{Peer Ratio}$$

- **Observed Peer Ratio:** Osmos knows GMV and ad spend for every active advertiser. The ratio is computed from the retailer's own data (e.g. *snacks brands doing ₹50L–1Cr monthly GMV spend an average of X% on media*).
- **Ad History Priority:** Where a brand has actual ad history, their prior spend is used directly.
- **Explicit Labeling:** Every opportunity clearly notes: `est. ₹24L/yr · from category peer benchmark`.

### Economic Routing Tiers

| Route | Annual Cost to Serve | Routed When Est. Spend Is | Operational Dispatch |
|---|---|---|---|
| **Named rep** | ~₹4–5L loaded rep time | Above ₹15L | A named person owns the relationship |
| **Rep-assisted** | ~₹1L (review & send) | ₹4L – ₹15L | Maestro prepares the offer; rep reviews and sends |
| **Nurture** | Near zero (DemandWise) | ₹50K – ₹4L | Cohort with attached offer. Escalates on engagement |
| **Self-serve** | Zero | Below ₹50K | Invitation with a pre-built starter campaign |

- **Confidence Modifier:** If est. spend is within 20% of a threshold boundary and the signal is thin (no ad history, new category) → **route down one tier** (e.g. Slurrp Farm, Two Brothers Organic).
- **Explicit Arithmetic:** The Route cell displays the exact calculation on hover/expand:
  > `Named rep — est. ₹24L/yr, above the ₹15L threshold`

### The Point of the Split

Moment strength decides *whether there is an opportunity*. Cheque size decides *who acts on it*. A small brand with a strong moment is a real opportunity routed to nurture — because the cheque is small, not because the opportunity is weak. DemandWise can tell 300 small brands "your category is spiking and inventory is cheap this week" for near-zero cost.

---

## 3. Data Model — Two Clocks

- **The Brand Record is Slow (Durable):** Contacts, ad history, cumulative spend, past campaigns, owning rep. It accumulates and persists over quarters.
- **The Opportunity is Fast (Volatile):** Categories spike and fade; inventory sells through. A strong opportunity this week may disappear next week.
- **Separation:**
  - `Brand` — durable: `name, category, monthlyGMV, contacts, adHistory, owningRep`
  - `Opportunity` — fast: `brandId, category, window, momentStrength, estAnnualSpend, route, generatedDate, status`
- **Behavior:** The Coverage screen lists **open opportunities**, not brands. The same brand can appear multiple times if it has moments in two categories (e.g. *Amul* in Dairy & Beverages; *Tata Sampann* in Staples & Snacks). The Brand Detail page shows the durable record plus an opportunity history underneath.
- **Refresh cadence:** Weekly, aligned to how sales teams plan.

### Cold Start States

| Case | System Behaviour |
|---|---|
| **New retailer, no advertisers yet** | No peer ratios, no ROAS benchmarks, no search baseline. Maestro shows the brand universe and unsold inventory by category, with an explicit empty state explaining scoring begins after ~1 quarter of data. *(Use the toggle on the Coverage screen to inspect)*. |
| **New category** | Borrows adjacent-category benchmarks, marked as low confidence, and routes down one tier. |
| **New brand, known category** | The common case: peer ratio and category benchmark exist; only the brand's own ad history is missing. |

---

## 4. Interactive Screens

1. **Coverage (Hero Screen — Badge: `V1`):**
   - *Top Activation Strip:* Leads with activation metrics:
     - Newly activated this quarter: **47** (brands advertising for the first time)
     - Active advertisers: **61 → 108** (1.9% → 3.4% of brand base)
     - Coverage opportunity identified: **₹18.4 Cr** (next 90 days)
     - Inventory unsold this week: **38%** (grocery search, weekdays)
   - *Open Opportunities Table:* Sorted by estimated value descending. Shows brand variants resolved (e.g. *Nestlé / Nestlé India / Maggi* as one brand record), moment strength bar, ad status pill, "Why now" phrase, estimated spend with peer benchmark note, and economic route with arithmetic reasoning.
   - *Interactive Filters:* Ad Status, Route, Category.
   - *Cold Start View Toggle:* Switches to unranked catalogue mode for zero-history onboarding.
2. **Brand Detail (Badge: `V1`, Adjust Loop: `Phase 2`):**
   - *Left Column (Why this brand):* Commerce signals (GMV, conversion rate vs category average, 90-day search sparkline, shelf share), ad history (with clean empty state for never-advertised brands), gate pass line (`Inventory available · Category ROAS 3.8×`), signal contribution bars, economic routing arithmetic, and Two Clocks Opportunity History across windows.
   - *Right Column (Generated Proposal & The Adjust Interaction):*
     - Live proposal card with flight dates, package name, CPM/CPC rates, and calculated forecast.
     - Live inventory constraint: `Homepage display: 94% sold — excluded from this package` in purple.
     - **The Adjust Interaction (`Phase 2`):** Swapping placements or moving the budget slider dynamically recalculates inventory availability, yield-derived pricing, and projected ROAS. Swapping to *Homepage Display* instantly shows `94% sold in this window — 2 of 21 slots available`.
     - **Campaign API Handover (`Brand accepted`):** Clicking `Brand accepted` flips the card to the exact API spec payload handed to the Campaign API (`POST /api/v2/campaigns/provision`) with the caption:
       > *"No AI in this step. Every decision was made during negotiation — the handover is a field mapping."*
3. **Pipeline (Badge: `Phase 4`):**
   - Answers the CRM stakeholder question with a 6-stage Kanban board (*Identified → Contacted → Proposal sent → Negotiating → Closed won / Closed lost*).
   - Target attainment and pipeline forecast strip.
   - Deal cards with Indian rep names and `Generated` (mint) vs `Manual` (dim) origin tags.
   - Toggle to sortable tabular List View.
4. **Routing Engine (Dispatch View — Badge: `Concept`):**
   - Proves Maestro conducts rather than executes across 4 sequential columns:
     - *Column 1:* This morning's route counts (12 named rep, 43 rep-assisted, 380 nurture, 1,240 self-serve).
     - *Column 2:* Downstream destinations (*DemandWise*, *Brand Self-Serve*, *Sofie Media Planner*, *Named Reps*).
     - *Column 3:* Returning sales tasks from DemandWise (*"DemandWise already raises sales tasks. Today they land nowhere. Maestro is where they land."*).
     - *Column 4:* Last quarter's cohort retention funnel: **Routed 1,675 → Contacted 1,240 → Activated 47 → Ran a second campaign 31 (66% repeat retention)**, proving that activated advertisers retain rather than churn.

---

## 5. Technology Stack & Design System

- **Zero-build static site:** Pure HTML5, CSS3, and modern JavaScript (ES modules). No node_modules, no compiler, no build step required.
- **Dark Theme Palette:**
  - Background: `#0B0E2A` (`--navy-900`)
  - Cards & Panels: `#141838` (`--navy-800`)
  - Active States & Hovers: `#1E2450` (`--navy-700`)
  - Primary Accent & Signals: `#4FE3C1` (`--mint`)
  - Human/Warning/Lapsed States: `#7C6CF0` (`--purple`)
  - Primary Text: `#F2F4FC` (`--white`)
  - Muted Text: `#8A90B8` (`--muted`)
  - Borders & Tertiary: `#3A4070` (`--dim`)
- **Typography:** Inter via Google Fonts. Strict typographical hierarchy and tabular layout.

---

## 6. Running Locally

Because Maestro is built with pure HTML, CSS, and JavaScript, you can run it using any static HTTP server.

Using Python 3 (built-in on macOS/Linux):
```bash
python3 -m http.server 3456
```
Then open your browser to [http://localhost:3456](http://localhost:3456).

Or using Node.js / npx (if installed):
```bash
npx serve .
```

---

## 7. Deploying to GitHub Pages

To publish to GitHub Pages:
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Maestro prototype"
   git push origin main
   ```
2. Go to your repository on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment**, select:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `root`
4. Click **Save**. Your prototype will be live at `https://<username>.github.io/<repo-name>/`.

---

## 8. Disclaimer

All data in this prototype is fictional and illustrative. Real brand names (Amul, Britannia, Cadbury, Paper Boat, etc.) are used solely to make the case study legible and realistic, not to represent actual commercial relationships or advertising agreements on BigBasket.
