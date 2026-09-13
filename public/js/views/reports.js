/**
 * CPI 360 - Latest Reports View
 * Displays a live, filterable feed of all submitted campus reports.
 */

const ReportsView = {
  _reports: [],
  _filters: { search: '', severity: '', status: '', category: '' },
  _sortBy: 'newest',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Latest Reports Feed</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 4px;">
            Real-time stream of all ingested campus complaints with AI-assigned metadata.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="ReportsView.refresh()" id="reports-refresh-btn">
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      <!-- Summary KPI Strip -->
      <div class="reports-kpi-strip" id="reports-kpi-strip">
        <div class="reports-kpi-item">
          <span class="reports-kpi-val" id="rkpi-total">--</span>
          <span class="reports-kpi-label">Total Reports</span>
        </div>
        <div class="reports-kpi-divider"></div>
        <div class="reports-kpi-item">
          <span class="reports-kpi-val" style="color:var(--p1-critical);" id="rkpi-critical">--</span>
          <span class="reports-kpi-label">Critical</span>
        </div>
        <div class="reports-kpi-divider"></div>
        <div class="reports-kpi-item">
          <span class="reports-kpi-val" style="color:var(--p2-high);" id="rkpi-high">--</span>
          <span class="reports-kpi-label">High</span>
        </div>
        <div class="reports-kpi-divider"></div>
        <div class="reports-kpi-item">
          <span class="reports-kpi-val" style="color:var(--status-open);" id="rkpi-open">--</span>
          <span class="reports-kpi-label">Open</span>
        </div>
        <div class="reports-kpi-divider"></div>
        <div class="reports-kpi-item">
          <span class="reports-kpi-val" style="color:var(--status-resolved);" id="rkpi-resolved">--</span>
          <span class="reports-kpi-label">Resolved</span>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="reports-toolbar card" style="margin-bottom: 22px; padding: 18px 22px;">
        <div style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 200px; position: relative;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1rem; pointer-events: none;">🔍</span>
            <input
              type="text"
              id="reports-search"
              class="text-input"
              placeholder="Search report text, location, reporter…"
              style="width: 100%; padding-left: 38px;"
              oninput="ReportsView._onFilter()"
            >
          </div>
          <select id="reports-filter-severity" class="select-input" onchange="ReportsView._onFilter()" style="min-width: 130px;">
            <option value="">All Severities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🔵 Low</option>
          </select>
          <select id="reports-filter-status" class="select-input" onchange="ReportsView._onFilter()" style="min-width: 130px;">
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select id="reports-sort" class="select-input" onchange="ReportsView._onSort()" style="min-width: 140px;">
            <option value="newest">⬇ Newest First</option>
            <option value="oldest">⬆ Oldest First</option>
            <option value="severity">🔥 By Severity</option>
          </select>
          <button class="btn btn-secondary" onclick="ReportsView._clearFilters()" style="white-space: nowrap;">✕ Clear</button>
        </div>
        <div id="reports-active-chips" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
      </div>

      <!-- Reports Feed -->
      <div id="reports-feed-container">
        <div class="reports-loading">
          <div class="reports-spinner"></div>
          <span>Loading latest reports…</span>
        </div>
      </div>
    `;

    await this._loadReports();
  },

  async _loadReports() {
    try {
      this._reports = await API.getReports();
      this._renderFeed();
      this._renderKPIs();
    } catch (err) {
      console.error(err);
      const c = document.getElementById('reports-feed-container');
      if (c) c.innerHTML = `
        <div class="card" style="text-align:center;padding:48px;color:var(--text-muted);">
          <div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div>
          <p>Failed to load reports: ${err.message}</p>
          <button class="btn btn-secondary" onclick="ReportsView.refresh()" style="margin-top:14px;">Try Again</button>
        </div>`;
    }
  },

  _renderKPIs() {
    const r = this._reports;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('rkpi-total',    r.length);
    set('rkpi-critical', r.filter(x => (x.severity || '').toUpperCase() === 'CRITICAL').length);
    set('rkpi-high',     r.filter(x => (x.severity || '').toUpperCase() === 'HIGH').length);
    set('rkpi-open',     r.filter(x => x.status === 'Open').length);
    set('rkpi-resolved', r.filter(x => x.status === 'Resolved').length);
  },

  _getFiltered() {
    const { search, severity, status } = this._filters;
    let list = [...this._reports];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        (r.text || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.reported_by || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q)
      );
    }
    if (severity) list = list.filter(r => (r.severity || '').toUpperCase() === severity.toUpperCase());
    if (status)   list = list.filter(r => r.status === status);

    if (this._sortBy === 'newest') {
      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (this._sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (this._sortBy === 'severity') {
      const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      list.sort((a, b) => (rank[(a.severity || '').toUpperCase()] ?? 9) - (rank[(b.severity || '').toUpperCase()] ?? 9));
    }
    return list;
  },

  _renderFeed() {
    const container = document.getElementById('reports-feed-container');
    if (!container) return;
    const filtered = this._getFiltered();
    this._renderActiveChips();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:56px;color:var(--text-muted);">
          <div style="font-size:2.8rem;margin-bottom:14px;">📭</div>
          <p style="font-size:1rem;font-weight:600;color:var(--text-secondary);">No reports match your filters</p>
          <p style="font-size:0.85rem;margin-top:4px;">Try adjusting your search or clearing filters</p>
          <button class="btn btn-secondary" onclick="ReportsView._clearFilters()" style="margin-top:16px;">Clear Filters</button>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-size:0.85rem;color:var(--text-muted);">
          Showing <strong style="color:var(--accent-cyan);">${filtered.length}</strong> of ${this._reports.length} reports
        </span>
      </div>
      <div class="reports-feed" id="reports-feed-list">
        ${filtered.map(r => this._renderReportCard(r)).join('')}
      </div>`;
  },

  _renderReportCard(r) {
    const sev = (r.severity || 'MEDIUM').toUpperCase();
    const sevMeta = {
      CRITICAL: { color: 'var(--p1-critical)', icon: '🔴', label: 'Critical' },
      HIGH:     { color: 'var(--p2-high)',     icon: '🟠', label: 'High'     },
      MEDIUM:   { color: 'var(--p3-medium)',   icon: '🟡', label: 'Medium'   },
      LOW:      { color: 'var(--p4-low)',       icon: '🔵', label: 'Low'      },
    }[sev] || { color: 'var(--p3-medium)', icon: '🟡', label: 'Medium' };

    const statusCls = (r.status || 'Open').replace(/\s+/g, '-');
    const ts = r.timestamp ? new Date(r.timestamp) : null;
    const timeAgo = ts ? this._timeAgo(ts) : 'Unknown';
    const timeStr = ts ? ts.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

    const clusterLink = r.assigned_cluster_id
      ? `<span class="report-card-cluster-link" onclick="event.stopPropagation();App.navigateTo('clusters')" title="View cluster #${r.assigned_cluster_id}">🔗 Cluster #${r.assigned_cluster_id}</span>`
      : `<span style="color:var(--text-muted);font-size:0.76rem;">Unassigned</span>`;

    return `
      <div class="report-feed-card" style="border-left:3px solid ${sevMeta.color};">
        <div class="report-feed-header">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="report-id-badge">#${r.report_id}</span>
            <span class="priority-badge priority-${sev}" style="font-size:0.72rem;">${sevMeta.icon} ${sevMeta.label}</span>
            <span class="status-badge status-${statusCls}">${r.status || 'Open'}</span>
            ${clusterLink}
          </div>
          <span class="report-timestamp" title="${timeStr}">🕐 ${timeAgo}</span>
        </div>
        <p class="report-feed-text">${this._escapeHtml(r.text || '')}</p>
        <div class="report-feed-meta">
          ${r.category   ? `<span class="department-tag">🏷️ ${r.category}</span>`   : ''}
          ${r.department ? `<span class="department-tag">🏢 ${r.department}</span>` : ''}
          ${r.location   ? `<span class="department-tag">📍 ${r.location}</span>`   : ''}
          ${r.reported_by? `<span class="report-reporter">👤 ${r.reported_by}</span>`: ''}
        </div>
      </div>`;
  },

  _renderActiveChips() {
    const chips = document.getElementById('reports-active-chips');
    if (!chips) return;
    const parts = [];
    if (this._filters.search.trim())
      parts.push(`<span class="filter-chip">🔍 "${this._filters.search.trim()}" <span class="chip-remove" onclick="ReportsView._removeFilter('search')">✕</span></span>`);
    if (this._filters.severity)
      parts.push(`<span class="filter-chip">Severity: ${this._filters.severity} <span class="chip-remove" onclick="ReportsView._removeFilter('severity')">✕</span></span>`);
    if (this._filters.status)
      parts.push(`<span class="filter-chip">Status: ${this._filters.status} <span class="chip-remove" onclick="ReportsView._removeFilter('status')">✕</span></span>`);
    chips.innerHTML = parts.join('');
    chips.style.marginTop = parts.length ? '12px' : '0';
  },

  _removeFilter(key) {
    this._filters[key] = '';
    if (key === 'search')   { const el = document.getElementById('reports-search');          if (el) el.value = ''; }
    if (key === 'severity') { const el = document.getElementById('reports-filter-severity'); if (el) el.value = ''; }
    if (key === 'status')   { const el = document.getElementById('reports-filter-status');   if (el) el.value = ''; }
    this._renderFeed();
  },

  _clearFilters() {
    this._filters = { search: '', severity: '', status: '', category: '' };
    this._sortBy = 'newest';
    ['reports-search','reports-filter-severity','reports-filter-status'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const sortEl = document.getElementById('reports-sort'); if (sortEl) sortEl.value = 'newest';
    this._renderFeed();
  },

  _onFilter() {
    this._filters.search   = document.getElementById('reports-search')?.value || '';
    this._filters.severity = document.getElementById('reports-filter-severity')?.value || '';
    this._filters.status   = document.getElementById('reports-filter-status')?.value || '';
    this._renderFeed();
  },

  _onSort() {
    this._sortBy = document.getElementById('reports-sort')?.value || 'newest';
    this._renderFeed();
  },

  async refresh() {
    const btn = document.getElementById('reports-refresh-btn');
    if (btn) btn.disabled = true;
    await this._loadReports();
    if (btn) btn.disabled = false;
    window.App?.showToast('Reports feed refreshed', 'info');
  },

  _timeAgo(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  },

  _escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};

window.ReportsView = ReportsView;
