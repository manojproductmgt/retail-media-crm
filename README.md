# Maestro — Retail Media CRM

A Retail Media CRM concept built for **Osmos.ai** (for BigBasket), designed as an interactive prototype for a product management case study.

---

## 1. Product Overview

Traditional CRMs depend on sales reps manually logging accounts, opportunities, and activities. But on a retail platform with thousands of brands in the catalogue, rep capacity is inherently bounded: only ~2% of brands ever get carried by human sales teams.

**Maestro** inverts this model: **it generates pipeline directly from platform commerce signals rather than relying on reps to type it in.**

Every brand in the catalogue is tracked, scored for advertising opportunity using live marketplace signals (GMV, category search acceleration, unsold ad inventory, historical ROAS), and routed to the optimal treatment:
- **Named rep** (high GMV / strategic accounts)
- **Rep-assisted** (mid-tier accounts with drafted proposals ready for review)
- **Automated nurture** (multi-channel drip campaigns triggered by commerce events)
- **Self-serve** (low-touch starter packages for tail brands)

> **Core Concept:** Maestro executes nothing. It decides. Other engines do the work — media planners draft packages, drip engines send offers, self-serve portals book inventory. Maestro determines who fires today, for which brand, based on real platform data.

---

## 2. Interactive Screens

1. **Coverage (Hero Screen):** The screen no competing CRM could render. Leads with activation over raw opportunity (as requested by board and pricing models):
   - *Newly activated this quarter:* **47** (brands advertising for the first time)
   - *Active advertisers:* **61 → 108** (1.9% → 3.4% of catalogue brand base)
   - *Coverage opportunity identified:* **₹18.4 Cr** (next 90 days)
   - *Inventory unsold this week:* **38%** (grocery search, weekdays)
   - *Ranked Catalogue Table:* ~25 rows across Head, Torso, and Tail brands with interactive filters (Ad Status, Route, Category), multi-column sorting, and clickable rows opening Brand Detail.
2. **Brand Detail:** Two-column deep dive for any brand:
   - *Left (Why this brand):* Commerce metrics on BigBasket (GMV, conversion rate vs category average, 90-day search trend sparkline, category shelf share), ad history (with clear empty states for first-time advertisers), and algorithmic scoring input contribution bars.
   - *Right (Generated Proposal):* An algorithmic offer with flight dates, placements, CPM/CPC pricing, estimated impressions, clicks, ROAS, and attributed GMV. Includes real-time inventory constraint callouts (e.g., *Homepage display: 94% sold — excluded from this package*) and one-click dispatch action buttons.
3. **Pipeline:** A CRM pipeline with forecast totals (Target, Committed attainment bar, Best case, Pipeline totals), Kanban board by stage (*Identified → Contacted → Proposal sent → Negotiating → Closed won / Closed lost*), origin badges (*Generated* vs *Manual*), and a toggle to a sortable list view.
4. **Routing Engine (Dispatch View):** 4-column architecture proving Maestro conducts rather than executes:
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
