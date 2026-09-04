// ============================================================
// Maestro — Interactive CRM Application
// Pure vanilla JavaScript, no build step required.
// ============================================================

import {
  coverageStats,
  categories,
  brands,
  pipelineDeals,
  routingSnapshot,
  pipelineForecast,
  getBrandById,
  formatINR,
  formatINRFull,
  formatDate,
} from '../data/seed.js';

// ── Placement Specs for Live Adjust Interaction ──────────────

const placementSpecs = {
  search: {
    id: 'slot_search_top_01',
    name: 'Grocery Search Top Slot',
    pricingModel: 'CPC',
    rate: 8,
    isConstrained: false,
    inventoryNote: null,
    availabilityText: 'Search Top Slot: 38% unsold in this window — 8 of 21 slots open',
    ctr: 0.04,
    baseROAS: 5.4,
  },
  homepage: {
    id: 'slot_hp_hero_display_01',
    name: 'Homepage Display Banner',
    pricingModel: 'CPM',
    rate: 220,
    isConstrained: true,
    inventoryNote: 'Homepage display: 94% sold in this window — 2 of 21 slots available',
    availabilityText: 'Homepage display: 94% sold in this window — 2 of 21 slots available',
    ctr: 0.015,
    baseROAS: 3.2,
  },
  crosssell: {
    id: 'slot_pdp_reorder_cross_02',
    name: 'Cart & Reorder Cross-Sell',
    pricingModel: 'CPC',
    rate: 6,
    isConstrained: false,
    inventoryNote: null,
    availabilityText: 'Cart Cross-sell: 55% unsold in this window — 12 of 21 slots available',
    ctr: 0.05,
    baseROAS: 6.2,
  },
};

// ── Application State ────────────────────────────────────────

const state = {
  currentScreen: 'coverage', // 'coverage' | 'brand-detail' | 'pipeline' | 'routing'
  selectedBrandId: 'amul',
  filters: {
    adStatus: 'all',
    route: 'all',
    category: 'all',
  },
  sort: {
    column: 'estOpportunity',
    direction: 'desc',
  },
  pipelineView: 'kanban', // 'kanban' | 'list'
  pipelineSort: {
    column: 'value',
    direction: 'desc',
  },
  adjust: {
    isOpen: true, // Visible by default for live demonstration
    placement: 'search',
    budget: null,
    isAccepted: false,
  },
  notification: null,
};

// ── Helpers ──────────────────────────────────────────────────

function renderSparkline(trend) {
  // Generate a plausible 7-point curve ending at the trend
  const isPositive = trend >= 0;
  const strokeColor = isPositive ? '#4FE3C1' : '#8A90B8';
  const base = 14;
  const points = isPositive
    ? [base + 4, base + 2, base + 3, base, base - 2, base - 5, base - 9]
    : [base - 6, base - 4, base - 5, base - 2, base + 1, base + 4, base + 7];

  const w = 84;
  const h = 24;
  const step = w / (points.length - 1);
  const pathD = points
    .map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${Math.max(2, Math.min(h - 2, y))}`)
    .join(' ');

  return `
    <div class="sparkline-container" title="Search volume 90-day trend">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
        <path d="${pathD}" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${(points.length - 1) * step}" cy="${Math.max(2, Math.min(h - 2, points[points.length - 1]))}" r="3" fill="${strokeColor}"/>
      </svg>
    </div>
  `;
}

function getAdStatusPill(status) {
  switch (status) {
    case 'active':
      return `<span class="pill pill-active"><span class="dot-mint"></span>Active</span>`;
    case 'lapsed':
      return `<span class="pill pill-lapsed"><span class="dot-dim" style="background:#7C6CF0;"></span>Lapsed</span>`;
    case 'never':
    default:
      return `<span class="pill pill-never"><span class="dot-dim"></span>Never advertised</span>`;
  }
}

function getRoutePill(route) {
  switch (route) {
    case 'Named rep':
      return `<span class="pill pill-named-rep"><span class="dot-mint"></span>Named rep</span>`;
    case 'Rep-assisted':
      return `<span class="pill pill-rep-assisted"><span class="dot-dim" style="background:#7C6CF0;"></span>Rep-assisted</span>`;
    case 'Nurture':
      return `<span class="pill pill-nurture"><span class="dot-mint" style="opacity:0.6;"></span>Nurture</span>`;
    case 'Self-serve':
    default:
      return `<span class="pill pill-self-serve"><span class="dot-dim"></span>Self-serve</span>`;
  }
}

function showToast(message) {
  let toast = document.getElementById('maestro-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'maestro-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '48px';
    toast.style.right = '40px';
    toast.style.background = 'var(--navy-700)';
    toast.style.border = '1px solid var(--mint)';
    toast.style.color = 'var(--white)';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '13px';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '999';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    toast.style.transition = 'opacity 0.2s, transform 0.2s';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:var(--mint); margin-right:8px;">✓</span> ${message}`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, 3000);
}

// ── Screen 1: Coverage (Badge: V1) ───────────────────────────

function renderCoverageScreen() {
  // Apply filtering
  let filtered = brands.filter((b) => {
    if (state.filters.adStatus !== 'all' && b.adStatus !== state.filters.adStatus) return false;
    if (state.filters.route !== 'all' && b.route !== state.filters.route) return false;
    if (state.filters.category !== 'all' && b.category !== state.filters.category) return false;
    return true;
  });

  // Apply sorting
  filtered.sort((a, b) => {
    let valA = a[state.sort.column];
    let valB = b[state.sort.column];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return state.sort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return state.sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortArrow = (col) => {
    if (state.sort.column !== col) return '<span class="sort-arrow">↕</span>';
    return `<span class="sort-arrow active">${state.sort.direction === 'asc' ? '▲' : '▼'}</span>`;
  };

  return `
    <div class="screen-enter">
      <!-- Screen Header with Scope Badge -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
        <div>
          <div class="page-title">Coverage</div>
          <div class="page-subtitle" style="margin-bottom:20px;">
            Full catalogue opportunity radar & autonomous routing engine · 
            <span style="color:var(--white);">North Star: conversion rate on generated opportunities</span>
          </div>
        </div>
        <span class="scope-badge scope-badge-v1">V1</span>
      </div>

      <!-- Top Stat Strip (Activation Led) -->
      <div class="stat-strip">
        <div class="stat-card card-mint">
          <div class="stat-card-label" style="color:var(--mint);">Newly activated this quarter</div>
          <div class="stat-card-value" style="color:var(--mint);">${coverageStats.newlyActivatedThisQuarter}</div>
          <div class="stat-card-sub">${coverageStats.newlyActivatedLabel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Active advertisers</div>
          <div class="stat-card-value">${coverageStats.activeAdvertisersDisplay}</div>
          <div class="stat-card-sub" style="color:var(--purple);">${coverageStats.activePercentDisplay}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Coverage opportunity identified</div>
          <div class="stat-card-value">${coverageStats.coverageOpportunity}</div>
          <div class="stat-card-sub">${coverageStats.coverageLabel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Inventory unsold this week</div>
          <div class="stat-card-value">${coverageStats.unsoldInventory}</div>
          <div class="stat-card-sub">${coverageStats.unsoldLabel}</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <span class="filter-label">Filter:</span>
        <select class="filter-select" id="filter-adStatus">
          <option value="all" ${state.filters.adStatus === 'all' ? 'selected' : ''}>Ad status: All</option>
          <option value="active" ${state.filters.adStatus === 'active' ? 'selected' : ''}>Active</option>
          <option value="lapsed" ${state.filters.adStatus === 'lapsed' ? 'selected' : ''}>Lapsed</option>
          <option value="never" ${state.filters.adStatus === 'never' ? 'selected' : ''}>Never advertised</option>
        </select>

        <select class="filter-select" id="filter-route">
          <option value="all" ${state.filters.route === 'all' ? 'selected' : ''}>Route: All</option>
          <option value="Named rep" ${state.filters.route === 'Named rep' ? 'selected' : ''}>Named rep</option>
          <option value="Rep-assisted" ${state.filters.route === 'Rep-assisted' ? 'selected' : ''}>Rep-assisted</option>
          <option value="Nurture" ${state.filters.route === 'Nurture' ? 'selected' : ''}>Nurture</option>
          <option value="Self-serve" ${state.filters.route === 'Self-serve' ? 'selected' : ''}>Self-serve</option>
        </select>

        <select class="filter-select" id="filter-category">
          <option value="all" ${state.filters.category === 'all' ? 'selected' : ''}>Category: All</option>
          ${categories.map((c) => `<option value="${c}" ${state.filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>

        ${
          state.filters.adStatus !== 'all' || state.filters.route !== 'all' || state.filters.category !== 'all'
            ? `<button id="btn-reset-filters" class="back-btn" style="margin:0; font-size:12px; color:var(--mint);">✕ Clear filters</button>`
            : ''
        }

        <span style="margin-left:auto; font-size:var(--fs-small); color:var(--muted);">
          Showing <strong>${filtered.length}</strong> of ${brands.length} catalogue brands
        </span>
      </div>

      <!-- Main Coverage Table -->
      <div class="data-table-wrapper">
        <table class="data-table" id="coverage-table">
          <thead>
            <tr>
              <th data-sort="name">Brand ${sortArrow('name')}</th>
              <th data-sort="monthlyGMV" style="text-align:right;">Monthly GMV ${sortArrow('monthlyGMV')}</th>
              <th data-sort="searchTrend">Search Trend ${sortArrow('searchTrend')}</th>
              <th data-sort="adStatus">Ad Status ${sortArrow('adStatus')}</th>
              <th>Surfaced Signal</th>
              <th data-sort="estOpportunity" style="text-align:right;">Est. Opportunity ${sortArrow('estOpportunity')}</th>
              <th data-sort="route">Route ${sortArrow('route')}</th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length === 0
                ? `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--muted);">No brands match the selected filters.</td></tr>`
                : filtered
                    .map((b) => {
                      const trendSign = b.searchTrend >= 0 ? `+${b.searchTrend}%` : `${b.searchTrend}%`;
                      const trendClass = b.searchTrend >= 0 ? 'trend-positive' : 'trend-negative';
                      return `
                  <tr data-brand-id="${b.id}" class="brand-row" title="Click to view proposal & commerce signals for ${b.name}">
                    <td>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span class="dot-mint" title="Opportunity present"></span>
                        <div>
                          <div class="brand-name-cell">${b.name}</div>
                          ${b.resolvedVariants ? `<div style="font-size:10px; color:var(--purple); margin-top:1px;">${b.resolvedVariants}</div>` : ''}
                          <div class="brand-category-cell">${b.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align:right; font-weight:600; color:var(--white);">
                      ${formatINR(b.monthlyGMV)}
                    </td>
                    <td>
                      <span class="${trendClass}">${trendSign}</span>
                    </td>
                    <td>
                      ${getAdStatusPill(b.adStatus)}
                    </td>
                    <td>
                      <div class="signal-text">${b.signal}</div>
                    </td>
                    <td style="text-align:right;">
                      <span class="opportunity-value">${formatINR(b.estOpportunity)}</span>
                      <div style="font-size:11px; color:var(--muted);">/ month</div>
                    </td>
                    <td>
                      ${getRoutePill(b.route)}
                    </td>
                  </tr>
                `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Screen 2: Brand Detail (Badge: V1, Adjust loop: Phase 2) ─

function renderBrandDetailScreen() {
  const brand = getBrandById(state.selectedBrandId) || brands[0];
  const { generatedOffer, signalInputs } = brand;

  // Initialize adjust budget if not set
  if (state.adjust.budget === null) {
    state.adjust.budget = generatedOffer.totalBudget;
  }

  const currentPlacementKey = state.adjust.placement || 'search';
  const currentSpec = placementSpecs[currentPlacementKey];
  const currentBudget = state.adjust.budget;
  const currentRate = currentSpec.rate;
  const currentPricingModel = currentSpec.pricingModel;

  // Live calculation of yield, volume, and forecast
  let estImpressions, estClicks, estROAS, estAttributedSales;
  if (currentPricingModel === 'CPM') {
    estImpressions = Math.round((currentBudget / currentRate) * 1000);
    estClicks = Math.round(estImpressions * currentSpec.ctr);
  } else {
    estClicks = Math.round(currentBudget / currentRate);
    estImpressions = Math.round(estClicks / currentSpec.ctr);
  }
  estROAS = currentSpec.baseROAS;
  estAttributedSales = Math.round(currentBudget * estROAS);

  const trendSign = brand.searchTrend >= 0 ? `+${brand.searchTrend}%` : `${brand.searchTrend}%`;
  const trendClass = brand.searchTrend >= 0 ? 'trend-positive' : 'trend-negative';

  return `
    <div class="screen-enter">
      <!-- Back button and Scope Badges -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <button class="back-btn" id="btn-back-coverage" style="margin-bottom:0;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Back to Coverage table</span>
        </button>
        <div style="display:flex; gap:8px;">
          <span class="scope-badge scope-badge-v1">V1</span>
          <span class="scope-badge scope-badge-phase">Adjust loop: Phase 2</span>
        </div>
      </div>

      <!-- Brand Header -->
      <div class="brand-header">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <h2 class="brand-header-name">${brand.name}</h2>
            ${getAdStatusPill(brand.adStatus)}
            ${getRoutePill(brand.route)}
          </div>
          <div class="brand-header-category">
            ${brand.category} · Platform Seller
            ${brand.resolvedVariants ? `<span style="color:var(--purple); margin-left:8px;">(${brand.resolvedVariants})</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="brand-detail-layout">
        <!-- Left Column: Why This Brand -->
        <div class="brand-detail-left">
          <!-- Commerce Panel -->
          <div class="detail-panel">
            <div class="detail-panel-title">Commerce Signals on BigBasket</div>
            <div class="detail-grid">
              <div>
                <div class="detail-item-label">Monthly GMV</div>
                <div class="detail-item-value large">${formatINR(brand.monthlyGMV)}</div>
              </div>
              <div>
                <div class="detail-item-label">Conversion Rate</div>
                <div class="detail-item-value large">
                  ${brand.conversionRate}% 
                  <span style="font-size:var(--fs-small); font-weight:400; color:var(--muted);">
                    (cat. avg ${brand.categoryAvgConversion}%)
                  </span>
                </div>
              </div>
              <div>
                <div class="detail-item-label">Search Volume Trend (90d)</div>
                <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
                  <span class="${trendClass}" style="font-size:16px;">${trendSign}</span>
                  ${renderSparkline(brand.searchTrend)}
                </div>
              </div>
              <div>
                <div class="detail-item-label">Share of Category Shelf</div>
                <div class="detail-item-value large">${brand.shelfShare}%</div>
              </div>
            </div>
          </div>

          <!-- Ad History Panel -->
          <div class="detail-panel">
            <div class="detail-panel-title">Advertising History</div>
            ${
              brand.adStatus === 'never'
                ? `
              <div class="empty-state">
                <div class="empty-state-icon">○</div>
                <div style="font-weight:600; color:var(--white); margin-bottom:4px;">Never advertised on BigBasket</div>
                <div>No historical campaigns or wallet records. Brand is growing purely through organic search discovery.</div>
              </div>
            `
                : `
              <div class="detail-grid">
                <div>
                  <div class="detail-item-label">Campaigns run</div>
                  <div class="detail-item-value">${brand.campaigns} campaigns</div>
                </div>
                <div>
                  <div class="detail-item-label">Total platform spend</div>
                  <div class="detail-item-value">${formatINR(brand.totalSpend)}</div>
                </div>
                <div>
                  <div class="detail-item-label">Historical avg. ROAS</div>
                  <div class="detail-item-value" style="color:var(--mint);">${brand.avgROAS}×</div>
                </div>
                <div>
                  <div class="detail-item-label">Last active campaign</div>
                  <div class="detail-item-value">${formatDate(brand.lastCampaignDate)}</div>
                </div>
                <div>
                  <div class="detail-item-label">Prepaid wallet balance</div>
                  <div class="detail-item-value">${formatINR(brand.walletBalance)}</div>
                </div>
              </div>
            `
            }
          </div>

          <!-- Signal Panel (Scoring Inputs) -->
          <div class="detail-panel">
            <div class="detail-panel-title">Scoring Inputs & Algorithm Weights</div>
            <div style="font-size:var(--fs-small); color:var(--muted); margin-bottom:14px;">
              Maestro scored this brand for <strong>${brand.route}</strong> dispatch based on four live platform variables:
            </div>

            <div class="signal-bar-item">
              <div class="signal-bar-label">
                <span class="signal-bar-name">1. Brand Monthly GMV</span>
                <span class="signal-bar-value">${signalInputs.brandGMV.value} · ${signalInputs.brandGMV.contribution}% weight</span>
              </div>
              <div class="signal-bar-track">
                <div class="signal-bar-fill" style="width:${signalInputs.brandGMV.contribution * 2.2}%;"></div>
              </div>
            </div>

            <div class="signal-bar-item">
              <div class="signal-bar-label">
                <span class="signal-bar-name">2. Category Search Movement</span>
                <span class="signal-bar-value">${signalInputs.categorySearch.value} · ${signalInputs.categorySearch.contribution}% weight</span>
              </div>
              <div class="signal-bar-track">
                <div class="signal-bar-fill" style="width:${signalInputs.categorySearch.contribution * 2.2}%;"></div>
              </div>
            </div>

            <div class="signal-bar-item">
              <div class="signal-bar-label">
                <span class="signal-bar-name">3. Category Unsold Inventory</span>
                <span class="signal-bar-value">${signalInputs.unsoldInventory.value} · ${signalInputs.unsoldInventory.contribution}% weight</span>
              </div>
              <div class="signal-bar-track">
                <div class="signal-bar-fill" style="width:${signalInputs.unsoldInventory.contribution * 2.2}%;"></div>
              </div>
            </div>

            <div class="signal-bar-item">
              <div class="signal-bar-label">
                <span class="signal-bar-name">4. Historical ROAS / Benchmark</span>
                <span class="signal-bar-value">${signalInputs.pastROAS.value} · ${signalInputs.pastROAS.contribution}% weight</span>
              </div>
              <div class="signal-bar-track">
                <div class="signal-bar-fill" style="width:${signalInputs.pastROAS.contribution * 2.2}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Generated Offer & Adjust Loop -->
        <div class="brand-detail-right">
          ${
            state.adjust.isAccepted
              ? `
            <!-- Handover Card Flip State -->
            <div class="handover-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                  <span class="pill pill-generated" style="margin-bottom:6px;">Campaign API Handover Spec</span>
                  <h3 style="font-size:18px; font-weight:700; color:var(--white);">Handover → Ad Stack Execution</h3>
                </div>
                <span class="pill pill-active" style="font-weight:700;">200 OK · Provisioned</span>
              </div>

              <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">
                Handing mapped negotiation parameters to <code>POST /api/v2/campaigns/provision</code>:
              </div>

              <div class="api-spec-block">{
  <span class="api-spec-key">"advertiser_id"</span>: <span class="api-spec-str">"bb_adv_${brand.id}"</span>,
  <span class="api-spec-key">"brand_name"</span>: <span class="api-spec-str">"${brand.name}"</span>,
  <span class="api-spec-key">"campaign_package"</span>: <span class="api-spec-str">"[Maestro] ${currentSpec.name}"</span>,
  <span class="api-spec-key">"placement_ids"</span>: [<span class="api-spec-str">"${currentSpec.id}"</span>],
  <span class="api-spec-key">"flight"</span>: {
    <span class="api-spec-key">"start_date"</span>: <span class="api-spec-str">"2026-10-01"</span>,
    <span class="api-spec-key">"end_date"</span>: <span class="api-spec-str">"2026-10-28"</span>
  },
  <span class="api-spec-key">"budget_inr"</span>: <span class="api-spec-num">${currentBudget}</span>,
  <span class="api-spec-key">"agreed_pricing"</span>: {
    <span class="api-spec-key">"pricing_model"</span>: <span class="api-spec-str">"${currentPricingModel}"</span>,
    <span class="api-spec-key">"rate_inr"</span>: <span class="api-spec-num">${currentRate}</span>,
    <span class="api-spec-key">"yield_checked"</span>: <span class="api-spec-num">true</span>
  },
  <span class="api-spec-key">"targeting"</span>: {
    <span class="api-spec-key">"category"</span>: <span class="api-spec-str">"${brand.category}"</span>,
    <span class="api-spec-key">"inventory_allocation"</span>: <span class="api-spec-str">"${currentSpec.isConstrained ? 'CONSTRAINED_RESERVED' : 'STANDARD_SEARCH'}"</span>
  },
  <span class="api-spec-key">"status"</span>: <span class="api-spec-str">"READY_FOR_AD_SERVER"</span>
}</div>

              <div class="handover-quote">
                <strong>"No AI in this step. Every decision was made during negotiation — the handover is a field mapping."</strong>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
                <button class="offer-btn" id="btn-modify-handover">
                  ← Modify Proposal / Negotiate
                </button>
                <span style="font-size:11px; color:var(--muted);">Dispatched to Ad Server</span>
              </div>
            </div>
          `
              : `
            <!-- Real-time Proposal Card -->
            <div class="offer-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div>
                  <span class="pill pill-generated" style="margin-bottom:6px;">Maestro Generated Proposal</span>
                  <h3 class="offer-package-name">${generatedOffer.packageName}</h3>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px;">Agreed Budget</div>
                  <div style="font-size:22px; font-weight:700; color:var(--mint);">${formatINR(currentBudget)}</div>
                </div>
              </div>

              <!-- Adjust Control Toggle Bar -->
              <div class="adjust-bar">
                <span style="font-size:var(--fs-small); color:var(--muted);">
                  Live yield & inventory simulation:
                </span>
                <button class="adjust-toggle-btn" id="btn-toggle-adjust">
                  ⚙ ${state.adjust.isOpen ? 'Hide Adjust' : 'Adjust Placement & Budget'}
                </button>
              </div>

              <!-- Interactive Adjust Panel -->
              ${
                state.adjust.isOpen
                  ? `
                <div class="adjust-panel">
                  <div class="adjust-field">
                    <div class="adjust-label">
                      <span>Swap Placement</span>
                      <span style="color:var(--mint); font-weight:400; text-transform:none;">Yield-derived pricing</span>
                    </div>
                    <select class="adjust-select" id="adjust-placement-select">
                      <option value="search" ${currentPlacementKey === 'search' ? 'selected' : ''}>
                        Grocery Search Top Slot (CPC ₹8 · Available)
                      </option>
                      <option value="homepage" ${currentPlacementKey === 'homepage' ? 'selected' : ''}>
                        Homepage Display Banner (CPM ₹220 · 94% Sold Out)
                      </option>
                      <option value="crosssell" ${currentPlacementKey === 'crosssell' ? 'selected' : ''}>
                        Cart & Reorder Cross-Sell (CPC ₹6 · High Availability)
                      </option>
                    </select>
                  </div>

                  <div class="adjust-field">
                    <div class="adjust-label">
                      <span>Adjust Budget</span>
                      <span class="adjust-slider-val" id="adjust-budget-display">${formatINR(currentBudget)}</span>
                    </div>
                    <div class="adjust-slider-row">
                      <input type="range" class="adjust-slider" id="adjust-budget-slider" min="25000" max="2500000" step="25000" value="${currentBudget}" />
                    </div>
                    <div style="display:flex; gap:6px; margin-top:8px;">
                      <button class="btn-budget-preset offer-btn" style="padding:4px 8px; font-size:11px;" data-val="100000">₹1 L</button>
                      <button class="btn-budget-preset offer-btn" style="padding:4px 8px; font-size:11px;" data-val="500000">₹5 L</button>
                      <button class="btn-budget-preset offer-btn" style="padding:4px 8px; font-size:11px;" data-val="850000">₹8.5 L</button>
                      <button class="btn-budget-preset offer-btn" style="padding:4px 8px; font-size:11px;" data-val="1500000">₹15 L</button>
                    </div>
                  </div>
                </div>
              `
                  : ''
              }

              <!-- Placements & Flight -->
              <div class="offer-section">
                <div class="offer-section-title">Package Inclusions & Flight</div>
                <div class="offer-row">
                  <span class="offer-row-label">Flight dates</span>
                  <span class="offer-row-value">${formatDate(generatedOffer.flightStart)} – ${formatDate(generatedOffer.flightEnd)}</span>
                </div>
                <div class="offer-row">
                  <span class="offer-row-label">Ad placement</span>
                  <span class="offer-row-value" style="color:var(--mint); font-weight:600;">
                    ${currentSpec.name}
                  </span>
                </div>
                <div class="offer-row">
                  <span class="offer-row-label">Yield-derived rate</span>
                  <span class="offer-row-value">₹${currentRate} / ${currentPricingModel}</span>
                </div>
              </div>

              <!-- Live Inventory Line (Constrained by availability) -->
              ${
                currentSpec.isConstrained
                  ? `
                <div class="offer-inventory-note">
                  <div style="font-weight:700; margin-bottom:2px;">Live Inventory Constraint</div>
                  <div>${currentSpec.availabilityText}</div>
                </div>
              `
                  : `
                <div class="offer-inventory-note" style="background:rgba(79, 227, 193, 0.08); color:var(--mint);">
                  <div style="font-weight:700; margin-bottom:2px;">Inventory Allocation Confirmed</div>
                  <div>${currentSpec.availabilityText}</div>
                </div>
              `
              }

              <!-- Performance Forecast -->
              <div class="offer-section">
                <div class="offer-section-title">Recalculated Algorithmic Forecast</div>
                <div class="offer-row">
                  <span class="offer-row-label">Est. impressions</span>
                  <span class="offer-row-value">${(estImpressions / 100000).toFixed(1)} Lakh</span>
                </div>
                <div class="offer-row">
                  <span class="offer-row-label">Est. clicks</span>
                  <span class="offer-row-value">${estClicks.toLocaleString('en-IN')}</span>
                </div>
                <div class="offer-row">
                  <span class="offer-row-label">Target ROAS</span>
                  <span class="offer-row-value" style="color:var(--mint); font-weight:700;">${estROAS}×</span>
                </div>
                <div class="offer-row">
                  <span class="offer-row-label">Est. attributed GMV</span>
                  <span class="offer-row-value" style="color:var(--mint); font-weight:700;">${formatINR(estAttributedSales)}</span>
                </div>
              </div>

              <!-- Dispatch Action Buttons & Acceptance Handover -->
              <div class="offer-actions" style="margin-top:16px;">
                <button class="offer-btn offer-btn-accept" id="btn-brand-accepted" title="Click to trigger Campaign API field handover">
                  Brand accepted → Handover
                </button>
                <button class="offer-btn" id="btn-action-rep" data-action="rep">
                  Send to rep
                </button>
                <button class="offer-btn" id="btn-action-nurture" data-action="nurture">
                  Route to nurture
                </button>
                <button class="offer-btn" id="btn-action-selfserve" data-action="selfserve">
                  Invite to self-serve
                </button>
              </div>
            </div>
          `
          }
        </div>
      </div>
    </div>
  `;
}

// ── Screen 3: Pipeline (Badge: Phase 4) ───────────────────────

function renderPipelineScreen() {
  const { target, committed, bestCase, pipeline } = pipelineForecast;
  const attainmentPercent = Math.round((committed / target) * 100);

  const stages = ['Identified', 'Contacted', 'Proposal sent', 'Negotiating', 'Closed won', 'Closed lost'];

  // List view sort
  let listDeals = [...pipelineDeals];
  listDeals.sort((a, b) => {
    let valA = a[state.pipelineSort.column];
    let valB = b[state.pipelineSort.column];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return state.pipelineSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return state.pipelineSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortArrow = (col) => {
    if (state.pipelineSort.column !== col) return '<span class="sort-arrow">↕</span>';
    return `<span class="sort-arrow active">${state.pipelineSort.direction === 'asc' ? '▲' : '▼'}</span>`;
  };

  return `
    <div class="screen-enter">
      <!-- Screen Header with View Toggle & Scope Badge -->
      <div class="pipeline-header">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <div class="page-title" style="margin-bottom:0;">Pipeline</div>
            <span class="scope-badge scope-badge-phase">Phase 4</span>
          </div>
          <div class="page-subtitle" style="margin-top:2px; margin-bottom:0;">
            Platform-generated ad sales deals & rep forecast · Deliberately post-V1
          </div>
        </div>
        <div class="view-toggle">
          <button class="view-toggle-btn ${state.pipelineView === 'kanban' ? 'active' : ''}" id="toggle-kanban">
            Kanban
          </button>
          <button class="view-toggle-btn ${state.pipelineView === 'list' ? 'active' : ''}" id="toggle-list">
            List view
          </button>
        </div>
      </div>

      <!-- Forecast Strip -->
      <div class="forecast-strip">
        <div class="forecast-card">
          <div class="forecast-label">Quarter Target</div>
          <div class="forecast-value">${formatINR(target)}</div>
          <div class="forecast-sub">Q3 FY27 Retail Media goal</div>
        </div>
        <div class="forecast-card card-mint">
          <div class="forecast-label" style="color:var(--mint);">Committed</div>
          <div class="forecast-value" style="color:var(--mint);">${formatINR(committed)}</div>
          <div class="forecast-sub">${attainmentPercent}% of target achieved</div>
          <div class="attainment-bar">
            <div class="attainment-fill" style="width:${Math.min(100, attainmentPercent)}%;"></div>
          </div>
        </div>
        <div class="forecast-card">
          <div class="forecast-label">Best Case</div>
          <div class="forecast-value">${formatINR(bestCase)}</div>
          <div class="forecast-sub">${Math.round((bestCase / target) * 100)}% weighted projection</div>
        </div>
        <div class="forecast-card">
          <div class="forecast-label">Total Pipeline</div>
          <div class="forecast-value">${formatINR(pipeline)}</div>
          <div class="forecast-sub">20 active commercial opportunities</div>
        </div>
      </div>

      <!-- Main Pipeline Content -->
      ${
        state.pipelineView === 'kanban'
          ? `
        <!-- Kanban View -->
        <div class="kanban-board">
          ${stages
            .map((stage) => {
              const stageDeals = pipelineDeals.filter((d) => d.stage === stage);
              const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

              return `
              <div class="kanban-column">
                <div class="kanban-column-header">
                  <span>${stage}</span>
                  <span class="kanban-count">${stageDeals.length}</span>
                </div>
                <div style="font-size:11px; color:var(--muted); margin-bottom:12px; font-weight:600;">
                  ${formatINR(stageTotal)}
                </div>
                <div class="kanban-cards-container">
                  ${
                    stageDeals.length === 0
                      ? `<div style="font-size:12px; color:var(--dim); text-align:center; padding:20px 0;">Empty stage</div>`
                      : stageDeals
                          .map((deal) => {
                            return `
                        <div class="kanban-card brand-deal-card" data-brand-id="${deal.brandId}" title="Click to view proposal for ${deal.brandName}">
                          <div class="kanban-card-brand">${deal.brandName}</div>
                          <div class="kanban-card-value">${formatINR(deal.value)}</div>
                          <div class="kanban-card-meta">
                            <span>${deal.owner}</span>
                            <span>${formatDate(deal.closeDate)}</span>
                          </div>
                          <div class="kanban-card-footer">
                            <span class="pill ${deal.origin === 'Generated' ? 'pill-generated' : 'pill-manual'}">
                              ${deal.origin}
                            </span>
                            <span style="font-size:11px; color:var(--muted);">View →</span>
                          </div>
                        </div>
                      `;
                          })
                          .join('')
                  }
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `
          : `
        <!-- List View -->
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th data-psort="brandName">Brand ${sortArrow('brandName')}</th>
                <th data-psort="value" style="text-align:right;">Deal Value ${sortArrow('value')}</th>
                <th data-psort="stage">Stage ${sortArrow('stage')}</th>
                <th data-psort="owner">Owner ${sortArrow('owner')}</th>
                <th data-psort="closeDate">Close Date ${sortArrow('closeDate')}</th>
                <th data-psort="origin">Origin ${sortArrow('origin')}</th>
              </tr>
            </thead>
            <tbody>
              ${listDeals
                .map((d) => {
                  return `
                  <tr data-brand-id="${d.brandId}" class="brand-row">
                    <td>
                      <div style="font-weight:600; color:var(--white);">${d.brandName}</div>
                    </td>
                    <td style="text-align:right; font-weight:700; color:var(--white);">
                      ${formatINR(d.value)}
                    </td>
                    <td>
                      <span class="pill pill-named-rep">${d.stage}</span>
                    </td>
                    <td style="color:var(--muted);">${d.owner}</td>
                    <td style="color:var(--muted);">${formatDate(d.closeDate)}</td>
                    <td>
                      <span class="pill ${d.origin === 'Generated' ? 'pill-generated' : 'pill-manual'}">
                        ${d.origin}
                      </span>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
      }
    </div>
  `;
}

// ── Screen 4: Routing (Badge: Concept) ────────────────────────

function renderRoutingScreen() {
  const { decisions, destinations, inboundTasks, cohortFunnel } = routingSnapshot;

  return `
    <div class="screen-enter">
      <!-- Screen Header with Concept Scope Badge -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <div>
          <div class="page-title">Routing Engine</div>
          <div class="page-subtitle">
            Maestro executes nothing. It decides. Other systems do the work — Maestro determines who fires today based on catalogue signals.
          </div>
        </div>
        <span class="scope-badge scope-badge-phase">Concept</span>
      </div>

      <!-- 4-Column Flow Layout -->
      <div class="routing-layout">
        <!-- Column 1: Decisions -->
        <div class="routing-column">
          <div class="routing-column-header">1. Today's Decisions</div>
          
          <div class="routing-decision-card" style="border-left:3px solid var(--mint);">
            <div class="routing-decision-label">Named Rep</div>
            <div class="routing-decision-count" style="color:var(--mint);">${decisions.namedRep}</div>
          </div>

          <div class="routing-decision-card" style="border-left:3px solid var(--purple);">
            <div class="routing-decision-label">Rep-Assisted</div>
            <div class="routing-decision-count" style="color:var(--purple);">${decisions.repAssisted}</div>
          </div>

          <div class="routing-decision-card">
            <div class="routing-decision-label">Nurture</div>
            <div class="routing-decision-count">${decisions.nurture}</div>
          </div>

          <div class="routing-decision-card">
            <div class="routing-decision-label">Self-Serve</div>
            <div class="routing-decision-count">${decisions.selfServe}</div>
          </div>

          <div class="routing-decision-card" style="opacity:0.6;">
            <div class="routing-decision-label">No Action</div>
            <div class="routing-decision-count" style="color:var(--dim);">${decisions.noAction}</div>
          </div>

          <div style="margin-top:20px; padding:12px; background:var(--navy-800); border:1px solid var(--dim); border-radius:var(--radius-sm); font-size:11px; color:var(--muted); line-height:1.4;">
            <strong style="color:var(--white);">3,140 brands</strong> evaluated daily against search spikes, unsold slots, and category ROAS.
          </div>
        </div>

        <!-- Column 2: Destinations -->
        <div class="routing-column">
          <div class="routing-column-header">2. Where Each Goes</div>

          ${destinations
            .map((dest) => {
              return `
              <div class="routing-dest-card">
                <div class="routing-dest-header">
                  <span class="routing-dest-icon">${dest.icon}</span>
                  <span class="routing-dest-name">${dest.name}</span>
                  <span class="routing-dest-received">${dest.received}</span>
                </div>
                <div class="routing-dest-desc">${dest.description}</div>
              </div>
            `;
            })
            .join('')}
        </div>

        <!-- Column 3: What Comes Back -->
        <div class="routing-column">
          <div class="routing-column-header">3. What Comes Back</div>

          <div style="font-size:var(--fs-small); color:var(--muted); margin-bottom:12px;">
            Inbound high-intent sales tasks returning from DemandWise into the pipeline:
          </div>

          ${inboundTasks
            .map((task) => {
              return `
              <div class="routing-inbound-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div class="routing-inbound-brand">${task.brand}</div>
                  <span class="pill pill-generated" style="font-size:10px;">${task.source}</span>
                </div>
                <div class="routing-inbound-action">${task.action}</div>
                <div class="routing-inbound-source">${task.daysAgo} day${task.daysAgo > 1 ? 's' : ''} ago</div>
              </div>
            `;
            })
            .join('')}

          <!-- Quote Caption Callout -->
          <div class="routing-caption">
            <strong>"DemandWise already raises sales tasks. Today they land nowhere. Maestro is where they land."</strong>
          </div>
        </div>

        <!-- Column 4: Did It Work (Last Quarter's Funnel) -->
        <div class="routing-column">
          <div class="routing-column-header">4. Did It Work</div>

          <div style="font-size:var(--fs-small); color:var(--muted); margin-bottom:12px;">
            Last quarter's cohort retention & repeat campaign funnel:
          </div>

          <div class="routing-funnel-container">
            ${cohortFunnel.steps
              .map((step, idx) => {
                const isLast = idx === cohortFunnel.steps.length - 1;
                return `
                <div class="routing-funnel-step ${step.highlight ? 'highlight' : ''}">
                  <div class="routing-funnel-step-header">
                    <span class="routing-funnel-step-name">${step.name}</span>
                    <span class="routing-funnel-step-count">${step.count}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="routing-funnel-step-sub">${step.subtext}</span>
                    <span style="font-size:11px; font-weight:700; color:${step.highlight ? 'var(--mint)' : 'var(--muted)'};">${step.percent}</span>
                  </div>
                </div>
                ${!isLast ? '<div class="routing-funnel-connector">↓</div>' : ''}
              `;
              })
              .join('')}
          </div>

          <div class="routing-retention-card">
            <div style="color:var(--white); font-weight:700; margin-bottom:4px;">Why Retention Proves The Model</div>
            <div>${cohortFunnel.caption}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Master Render & Event Bindings ────────────────────────────

function render() {
  const container = document.getElementById('main-content');
  if (!container) return;

  // Update sidebar active states
  document.querySelectorAll('.sidebar-nav-item').forEach((item) => {
    const screen = item.getAttribute('data-screen');
    if (screen === state.currentScreen) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render appropriate screen
  switch (state.currentScreen) {
    case 'coverage':
      container.innerHTML = renderCoverageScreen();
      bindCoverageEvents();
      break;
    case 'brand-detail':
      container.innerHTML = renderBrandDetailScreen();
      bindBrandDetailEvents();
      break;
    case 'pipeline':
      container.innerHTML = renderPipelineScreen();
      bindPipelineEvents();
      break;
    case 'routing':
      container.innerHTML = renderRoutingScreen();
      break;
  }
}

function bindCoverageEvents() {
  // Filter changes
  const adStatusSelect = document.getElementById('filter-adStatus');
  if (adStatusSelect) {
    adStatusSelect.addEventListener('change', (e) => {
      state.filters.adStatus = e.target.value;
      render();
    });
  }

  const routeSelect = document.getElementById('filter-route');
  if (routeSelect) {
    routeSelect.addEventListener('change', (e) => {
      state.filters.route = e.target.value;
      render();
    });
  }

  const catSelect = document.getElementById('filter-category');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      render();
    });
  }

  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.filters.adStatus = 'all';
      state.filters.route = 'all';
      state.filters.category = 'all';
      render();
    });
  }

  // Sorting
  document.querySelectorAll('#coverage-table th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (state.sort.column === col) {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.column = col;
        state.sort.direction = 'desc';
      }
      render();
    });
  });

  // Row click -> opens Brand Detail
  document.querySelectorAll('.brand-row').forEach((row) => {
    row.addEventListener('click', () => {
      const brandId = row.getAttribute('data-brand-id');
      if (brandId) {
        state.selectedBrandId = brandId;
        state.adjust.isAccepted = false;
        state.adjust.placement = 'search';
        const brand = getBrandById(brandId) || brands[0];
        state.adjust.budget = brand.generatedOffer.totalBudget;
        state.currentScreen = 'brand-detail';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function bindBrandDetailEvents() {
  const backBtn = document.getElementById('btn-back-coverage');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      state.currentScreen = 'coverage';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Toggle Adjust panel
  const toggleAdjustBtn = document.getElementById('btn-toggle-adjust');
  if (toggleAdjustBtn) {
    toggleAdjustBtn.addEventListener('click', () => {
      state.adjust.isOpen = !state.adjust.isOpen;
      render();
    });
  }

  // Placement swap
  const placementSelect = document.getElementById('adjust-placement-select');
  if (placementSelect) {
    placementSelect.addEventListener('change', (e) => {
      state.adjust.placement = e.target.value;
      render();
    });
  }

  // Budget slider
  const budgetSlider = document.getElementById('adjust-budget-slider');
  if (budgetSlider) {
    budgetSlider.addEventListener('input', (e) => {
      state.adjust.budget = parseInt(e.target.value, 10);
      const display = document.getElementById('adjust-budget-display');
      if (display) display.innerText = formatINR(state.adjust.budget);
    });
    budgetSlider.addEventListener('change', (e) => {
      state.adjust.budget = parseInt(e.target.value, 10);
      render();
    });
  }

  // Budget quick presets
  document.querySelectorAll('.btn-budget-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      state.adjust.budget = val;
      render();
    });
  });

  // Brand accepted → Handover state change
  const brandAcceptedBtn = document.getElementById('btn-brand-accepted');
  if (brandAcceptedBtn) {
    brandAcceptedBtn.addEventListener('click', () => {
      state.adjust.isAccepted = true;
      render();
      showToast('Campaign API handover spec provisioned');
    });
  }

  // Reset from handover back to modify
  const modifyHandoverBtn = document.getElementById('btn-modify-handover');
  if (modifyHandoverBtn) {
    modifyHandoverBtn.addEventListener('click', () => {
      state.adjust.isAccepted = false;
      render();
    });
  }

  // Action buttons
  const actions = [
    { id: 'btn-action-rep', label: 'Dispatched to Named Rep queue' },
    { id: 'btn-action-nurture', label: 'Queued in DemandWise drip cohort' },
    { id: 'btn-action-selfserve', label: 'Sent self-serve starter invite' },
  ];

  actions.forEach(({ id, label }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        btn.classList.add('confirmed');
        btn.innerHTML = `✓ Dispatched`;
        showToast(label);
      });
    }
  });
}

function bindPipelineEvents() {
  const toggleKanban = document.getElementById('toggle-kanban');
  const toggleList = document.getElementById('toggle-list');

  if (toggleKanban) {
    toggleKanban.addEventListener('click', () => {
      state.pipelineView = 'kanban';
      render();
    });
  }

  if (toggleList) {
    toggleList.addEventListener('click', () => {
      state.pipelineView = 'list';
      render();
    });
  }

  // Deal card click -> opens Brand Detail
  document.querySelectorAll('.brand-deal-card, .brand-row').forEach((item) => {
    item.addEventListener('click', () => {
      const brandId = item.getAttribute('data-brand-id');
      if (brandId) {
        state.selectedBrandId = brandId;
        state.adjust.isAccepted = false;
        state.adjust.placement = 'search';
        const brand = getBrandById(brandId) || brands[0];
        state.adjust.budget = brand.generatedOffer.totalBudget;
        state.currentScreen = 'brand-detail';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Pipeline list sort
  document.querySelectorAll('th[data-psort]').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-psort');
      if (state.pipelineSort.column === col) {
        state.pipelineSort.direction = state.pipelineSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.pipelineSort.column = col;
        state.pipelineSort.direction = 'desc';
      }
      render();
    });
  });
}

// ── Global Navigation ────────────────────────────────────────

function initNavigation() {
  document.querySelectorAll('.sidebar-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScreen = btn.getAttribute('data-screen');
      if (targetScreen) {
        state.currentScreen = targetScreen;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  render();
});
