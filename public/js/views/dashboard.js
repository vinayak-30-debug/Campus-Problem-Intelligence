/**
 * CPI 360 - Executive Dashboard View
 */

const DashboardView = {
  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Executive Campus Intelligence</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 4px;">
            Autonomous recurring problem clustering, severity escalation, and multi-department resolution tracking.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="DashboardView.refresh()">
            <span>🔄</span> Refresh Data
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid" id="dashboard-kpis">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Reports Ingested</span>
            <div class="kpi-icon blue">📋</div>
          </div>
          <div class="kpi-value" id="kpi-total-reports">--</div>
          <div class="kpi-subtitle">
            <span class="kpi-badge-pill badge-cyan">Seed DB Active</span> Across August 2026
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Deduplication Rate</span>
            <div class="kpi-icon purple">🧠</div>
          </div>
          <div class="kpi-value" id="kpi-dedup-rate">--%</div>
          <div class="kpi-subtitle">
            <span class="kpi-badge-pill badge-emerald" id="kpi-noise-saved">-- noise eliminated</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Active Problem Clusters</span>
            <div class="kpi-icon amber">🎯</div>
          </div>
          <div class="kpi-value" id="kpi-total-clusters">--</div>
          <div class="kpi-subtitle">
            <span id="kpi-recurring-count">-- recurring issues</span> &bull; <span id="kpi-oneoff-count">-- one-offs</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Resolution Rate</span>
            <div class="kpi-icon emerald">✅</div>
          </div>
          <div class="kpi-value" id="kpi-resolution-rate">--%</div>
          <div class="kpi-subtitle">
            <span id="kpi-resolved-stats">-- resolved</span>
          </div>
        </div>
      </div>

      <!-- Charts & Insights Grid -->
      <div class="content-grid-2">
        <!-- Incident Timeline -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h3>Incident Volume Timeline (August 2026)</h3>
              <p>Temporal distribution of incoming student complaints and escalation spikes</p>
            </div>
            <span class="kpi-badge-pill badge-cyan">Time-Series</span>
          </div>
          <div id="timeline-chart-container" style="min-height: 220px;"></div>
        </div>

        <!-- Campus Hotspots -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h3>Campus Problem Hotspots</h3>
              <p>Highest complaint density locations</p>
            </div>
            <span class="kpi-badge-pill badge-rose">Top Areas</span>
          </div>
          <div id="hotspots-list" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="color: var(--text-muted); font-size: 0.85rem;">Loading locations...</div>
          </div>
        </div>
      </div>

      <!-- Department Workloads & Categories Grid -->
      <div class="content-grid-half">
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h3>Department Workloads & Resolution</h3>
              <p>Assigned issue volumes and resolution rates across administrative offices</p>
            </div>
          </div>
          <div id="department-bars-container"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h3>Category Breakdown & Priority Distribution</h3>
              <p>Issue taxonomy classified by AI model</p>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
              Priority Distribution (Multi-Factor Escalation)
            </div>
            <div id="priority-pills" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
          </div>
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
              Category Distribution
            </div>
            <div id="category-pills" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    try {
      const analytics = await API.getAnalytics();

      // Populate KPIs
      document.getElementById('kpi-total-reports').textContent = analytics.total_reports;
      document.getElementById('kpi-dedup-rate').textContent = `${analytics.deduplication_rate_percent}%`;
      document.getElementById('kpi-noise-saved').textContent = `${analytics.duplicate_reports_merged} duplicate reports merged`;
      document.getElementById('kpi-total-clusters').textContent = analytics.total_clusters;
      document.getElementById('kpi-recurring-count').textContent = `${analytics.recurring_clusters} recurring`;
      document.getElementById('kpi-oneoff-count').textContent = `${analytics.isolated_reports} isolated`;
      document.getElementById('kpi-resolution-rate').textContent = `${analytics.resolution_rate_percent}%`;
      document.getElementById('kpi-resolved-stats').textContent = `${analytics.status_breakdown.Resolved || 0} clusters closed`;

      // Render Charts
      Charts.renderTimelineChart('timeline-chart-container', analytics.timeline_trend);
      Charts.renderDepartmentBars('department-bars-container', analytics.department_breakdown);

      // Render Hotspots
      const hotspotsContainer = document.getElementById('hotspots-list');
      if (hotspotsContainer && analytics.location_hotspots) {
        hotspotsContainer.innerHTML = analytics.location_hotspots.map((h, i) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.75rem; font-family: 'JetBrains Mono'; font-weight: 700; color: var(--accent-cyan);">#${i+1}</span>
              <span style="font-size: 0.86rem; font-weight: 600; color: #f1f5f9;">${h.location}</span>
            </div>
            <span class="duplicate-count-badge" style="font-size: 0.76rem; padding: 2px 8px;">${h.count} reports</span>
          </div>
        `).join('');
      }

      // Priority Pills
      const priorityContainer = document.getElementById('priority-pills');
      if (priorityContainer && analytics.priority_breakdown) {
        priorityContainer.innerHTML = Object.entries(analytics.priority_breakdown).map(([lvl, count]) => `
          <div class="priority-badge priority-${lvl}" style="font-size: 0.85rem; padding: 6px 14px;">
            ${lvl}: <strong>${count}</strong>
          </div>
        `).join('');
      }

      // Category Pills
      const catContainer = document.getElementById('category-pills');
      if (catContainer && analytics.category_breakdown) {
        catContainer.innerHTML = Object.entries(analytics.category_breakdown).map(([cat, count]) => `
          <span class="department-tag" style="font-size: 0.82rem; padding: 5px 12px;">
            ${cat} <strong style="color: var(--accent-cyan); margin-left: 4px;">(${count})</strong>
          </span>
        `).join('');
      }

    } catch (err) {
      console.error(err);
      window.App.showToast('Failed to load dashboard data', 'danger');
    }
  },

  async refresh() {
    await this.loadData();
    window.App.showToast('Dashboard metrics refreshed', 'info');
  }
};

window.DashboardView = DashboardView;
