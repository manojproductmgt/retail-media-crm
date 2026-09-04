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
| **Coverage** | `V1` | Core Hero Radar: Surfaces opportunity across all 3,140 catalogue brands |
| **Brand Detail** | `V1` *(Adjust loop: `Phase 2`)* | Deep-dive signals + live inventory negotiation and campaign handover |
| **Pipeline** | `Phase 4` | Answers the "you were asked for a CRM" question (deliberately post-V1) |
| **Routing** | `Concept` | Proves Maestro decides and conducts rather than executes |

> **Core Concept:** Maestro executes nothing. It decides. Other engines do the work — media planners draft packages, drip engines send offers, self-serve portals book inventory. Maestro determines who fires today, for which brand, based on real platform data.

---

## 2. Interactive Screens

1. **Coverage (Hero Screen — Badge: `V1`):** The screen no competing CRM could render. Leads with activation over raw opportunity:
   - *Newly activated this quarter:* **47** (brands advertising for the first time)
   - *Active advertisers:* **61 → 108** (1.9% → 3.4% of catalogue brand base)
   - *Coverage opportunity identified:* **₹18.4 Cr** (next 90 days)
   - *Inventory unsold this week:* **38%** (grocery search, weekdays)
   - *Ranked Catalogue Table:* ~25 rows across Head, Torso, and Tail brands with interactive filters (*Ad Status, Route, Category*), multi-column sorting, variant resolution (e.g. *Nestlé, Nestlé India, Maggi resolved to one row*), and clickable rows opening Brand Detail.
2. **Brand Detail (Badge: `V1`, Adjust Loop: `Phase 2`):** Two-column deep dive:
   - *Left (Why this brand):* BigBasket commerce signals (GMV, conversion rate vs category average, 90-day search trend sparkline, category shelf share), ad history (with clean empty state for never-advertised brands), and algorithmic scoring input contribution bars.
   - *Right (Generated Proposal & The Adjust Interaction):*
     - Live proposal card displaying package name, flight dates, placement, CPM/CPC rate, and calculated forecast.
     - **The Adjust Interaction (`Phase 2`):** Swapping placements or adjusting budget updates availability, yield-derived price, and forecast in real time. For instance, selecting *Homepage Display Banner* immediately exposes:
       > `Homepage display: 94% sold in this window — 2 of 21 slots available`
     - **Handover State (`Brand accepted`):** Clicking `Brand accepted → Handover` flips the card to reveal the exact JSON payload handed to the Campaign API (`POST /api/v2/campaigns/provision`) with the caption:
       > *"No AI in this step. Every decision was made during negotiation — the handover is a field mapping."*
3. **Pipeline (Badge: `Phase 4`):** A recognisable CRM answering the stakeholder question:
   - Forecast strip (*Target, Committed attainment bar, Best case, Pipeline totals*).
   - 6-stage Kanban board (*Identified → Contacted → Proposal sent → Negotiating → Closed won / Closed lost*) with Indian rep names and `Generated` vs. `Manual` origin badges.
   - Toggle to a sortable List View.
4. **Routing Engine (Dispatch View — Badge: `Concept`):** 4-column architecture proving Maestro conducts rather than executes:
   - *Column 1 (Decisions):* Today's route decisions (12 named rep, 43 rep-assisted, 380 nurture, 1,240 self-serve).
   - *Column 2 (Destinations):* Downstream execution systems (*DemandWise*, *Brand Self-Serve*, *Sofie Media Planner*, *Named Reps*).
   - *Column 3 (What comes back):* Inbound sales tasks returning from DemandWise into the pipeline with the caption:
     > *"DemandWise already raises sales tasks. Today they land nowhere. Maestro is where they land."*
   - *Column 4 (Did it work):* Funnel tracking last quarter's cohort: **Routed 1,675 → Contacted 1,240 → Activated 47 → Ran a second campaign 31 (66% repeat retention)**, directly proving that activated advertisers retain rather than churn.

---

## 3. Technology Stack & Design System

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

## 4. Running Locally

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

## 5. Deploying to GitHub Pages

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

## 6. Disclaimer

All data in this prototype is fictional and illustrative. Real brand names (Amul, Britannia, Cadbury, Paper Boat, etc.) are used solely to make the case study legible and realistic, not to represent actual commercial relationships or advertising agreements on BigBasket.
