/**
 * CPI 360 - Recurring Issues Matrix View
 */

const ClustersView = {
  currentClusters: [],
  expandedClusterIds: new Set(),
  highlightId: null,

  async render(container, params = {}) {
    if (params.highlightId) {
      this.highlightId = Number(params.highlightId);
      this.expandedClusterIds.add(this.highlightId);
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Recurring Issues Matrix</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 4px;">
            AI-grouped problem clusters. Near-duplicate complaints are unified into single actionable work orders with aggregated priority.
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-secondary" onclick="App.toggleShortcutHelp()" title="Keyboard shortcuts (?)" style="gap: 6px;">⌨️ Shortcuts</button>
          <button class="btn btn-secondary" onclick="ClustersView.expandAll()">Expand All</button>
          <button class="btn btn-secondary" onclick="ClustersView.collapseAll()">Collapse All</button>
          <button class="btn btn-primary" onclick="ClustersView.exportCSV()"><span>📥</span> Export Clustered CSV</button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Filter &amp; Search</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span id="active-filter-count" style="display: none; font-size: 0.75rem; font-weight: 700; background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.35); padding: 2px 9px; border-radius: 12px;"></span>
            <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 0.8rem;" onclick="ClustersView.clearFilters()">✕ Clear</button>
          </div>
        </div>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 220px; position: relative;">
            <input 
              type="text" 
              id="cluster-search" 
              class="form-input" 
              placeholder="Search issues, keywords, locations… (Press / to focus)"
              oninput="ClustersView.applyFilters()"
              style="padding-right: 40px;"
            />
            <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; color: var(--text-muted); pointer-events: none; font-family: 'JetBrains Mono', monospace; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px; border: 1px solid var(--border-subtle);">/</span>
          </div>

          <div>
            <select id="filter-dept" class="select-input" onchange="ClustersView.applyFilters()">
              <option value="">All Departments</option>
              <option value="IT Services">IT Services</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Academic Office">Academic Office</option>
              <option value="Examination Cell">Examination Cell</option>
              <option value="Sports Department">Sports Department</option>
              <option value="Transport Office">Transport Office</option>
              <option value="Security Office">Security Office</option>
              <option value="Accounts Office">Accounts Office</option>
            </select>
          </div>

          <div>
            <select id="filter-status" class="select-input" onchange="ClustersView.applyFilters()">
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <select id="filter-priority" class="select-input" onchange="ClustersView.applyFilters()">
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical (P1)</option>
              <option value="HIGH">High (P2)</option>
              <option value="MEDIUM">Medium (P3)</option>
              <option value="LOW">Low (P4)</option>
            </select>
          </div>

          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; color: var(--text-secondary); cursor: pointer; user-select: none;">
            <input type="checkbox" id="filter-recurring" onchange="ClustersView.applyFilters()" />
            <span>Recurring Only (2+ reports)</span>
          </label>
        </div>
      </div>

      <!-- Clusters Accordion List -->
      <div id="clusters-list-header" style="display: none; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <span id="clusters-result-count" style="font-size: 0.85rem; color: var(--text-secondary);"></span>
        <span style="font-size: 0.78rem; color: var(--text-muted);">Sorted by priority score ↓</span>
      </div>
      <div id="clusters-list-container">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          Loading problem clusters...
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    try {
      this.currentClusters = await API.getClusters();
      this.renderClusterCards(this.currentClusters);

      if (this.highlightId) {
        setTimeout(() => {
          const el = document.getElementById(`cluster-${this.highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.6)';
            setTimeout(() => { el.style.boxShadow = ''; }, 3000);
          }
        }, 300);
      }
    } catch (err) {
      console.error(err);
      window.App.showToast('Failed to load clusters', 'danger');
    }
  },

  applyFilters() {
    const search = (document.getElementById('cluster-search')?.value || '').toLowerCase();
    const dept = document.getElementById('filter-dept')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const priority = document.getElementById('filter-priority')?.value || '';
    const recurringOnly = document.getElementById('filter-recurring')?.checked || false;

    // Update active filter count pill
    const activeCount = [search, dept, status, priority, recurringOnly].filter(Boolean).length;
    const pill = document.getElementById('active-filter-count');
    if (pill) {
      if (activeCount > 0) {
        pill.textContent = `${activeCount} active filter${activeCount > 1 ? 's' : ''}`;
        pill.style.display = 'inline-block';
      } else {
        pill.style.display = 'none';
      }
    }

    let filtered = this.currentClusters.filter(c => {
      if (dept && c.department.toLowerCase() !== dept.toLowerCase()) return false;
      if (status && c.status.toLowerCase() !== status.toLowerCase()) return false;
      if (priority && c.priority_level.toLowerCase() !== priority.toLowerCase()) return false;
      if (recurringOnly && !c.is_recurring) return false;
      if (search) {
        const textMatch = c.title.toLowerCase().includes(search) || 
                          c.location.toLowerCase().includes(search) ||
                          c.category.toLowerCase().includes(search) ||
                          c.reports.some(r => r.text.toLowerCase().includes(search) || r.report_id.toLowerCase().includes(search));
        if (!textMatch) return false;
      }
      return true;
    });

    this.renderClusterCards(filtered, this.currentClusters.length);
  },

  renderClusterCards(clusters, totalCount) {
    const container = document.getElementById('clusters-list-container');
    const header = document.getElementById('clusters-list-header');
    const countEl = document.getElementById('clusters-result-count');
    if (!container) return;

    // Update result count
    const total = totalCount !== undefined ? totalCount : clusters.length;
    if (header && countEl) {
      header.style.display = 'flex';
      if (clusters.length === total) {
        countEl.textContent = `Showing all ${total} issue${total !== 1 ? 's' : ''}`;
      } else {
        countEl.innerHTML = `Showing <strong style="color:#fff">${clusters.length}</strong> of ${total} issues`;
      }
    }

    if (clusters.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No problem clusters match the selected criteria.
        </div>
      `;
      return;
    }

    const isJudgeMode = window.App.isJudgeMode;

    container.innerHTML = clusters.map(c => {
      const isExpanded = this.expandedClusterIds.has(c.cluster_id);
      const borderClass = `${c.priority_level.toLowerCase()}-border`;

      return `
        <div class="cluster-card ${borderClass} ${isExpanded ? 'expanded' : ''}" id="cluster-${c.cluster_id}">
          <div class="cluster-header-row" onclick="ClustersView.toggleCluster(${c.cluster_id})">
            <div class="cluster-main-info">
              <span class="cluster-id-badge">#${c.cluster_id}</span>
              <div class="cluster-title-box">
                <h4>${c.title}</h4>
                <div class="cluster-meta-row">
                  <span class="department-tag">🏢 ${c.department}</span>
                  <span>📍 ${c.location}</span>
                  <span class="status-badge status-${c.status.replace(/\s+/g, '')}">${c.status}</span>
                </div>
              </div>
            </div>

            <div class="cluster-stats-col">
              <span class="duplicate-count-badge">
                <span>👥</span> ${c.report_count} ${c.report_count > 1 ? 'reports (grouped)' : 'report'}
              </span>
              <div class="priority-badge priority-${c.priority_level}">
                ${c.priority_level} <span style="font-size: 0.7rem; opacity: 0.85;">(${c.priority_score})</span>
              </div>
              <span class="chevron-icon">▼</span>
            </div>
          </div>

          <!-- Drawer: Reports List & Admin Resolution Controls -->
          <div class="cluster-body-drawer">
            <div class="drawer-actions-bar">
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                Active between <strong style="color: #fff;">${c.first_reported}</strong> and <strong style="color: #fff;">${c.last_reported}</strong>
              </div>

              <!-- Live Status Changer for Judges & Admin -->
              <div class="status-change-control">
                <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Update Resolution:</span>
                <select class="select-input" id="status-select-${c.cluster_id}" onchange="ClustersView.handleStatusChange(${c.cluster_id})">
                  <option value="Open" ${c.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
              </div>
            </div>

            ${c.resolution_notes ? `
              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.85rem; color: #a7f3d0; margin-bottom: 16px;">
                <strong>Resolution Notes:</strong> ${c.resolution_notes}
              </div>
            ` : ''}

            <!-- Constituent Reports Table -->
            <div style="overflow-x: auto;">
              <table class="reports-list-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Student Complaint (Paraphrased Wording)</th>
                    <th>Reported By</th>
                    <th>Timestamp</th>
                    <th>Severity</th>
                    <th>Status</th>
                    ${!isJudgeMode ? `<th>True Cluster</th>` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${c.reports.map(r => `
                    <tr>
                      <td class="mono" style="color: var(--accent-cyan); font-weight: 600;">${r.report_id}</td>
                      <td class="report-text-cell">"${r.text}"</td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">${r.reported_by}</td>
                      <td class="mono" style="font-size: 0.78rem;">${r.timestamp}</td>
                      <td>
                        <span style="font-size: 0.75rem; font-weight: 600; color: ${r.severity === 'High' ? '#f87171' : (r.severity === 'Medium' ? '#facc15' : '#60a5fa')}">
                          ${r.severity}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge status-${r.status.replace(/\s+/g, '')}" style="font-size: 0.72rem; padding: 2px 7px;">
                          ${r.status}
                        </span>
                      </td>
                      ${!isJudgeMode ? `
                        <td class="mono" style="color: #94a3b8; font-size: 0.78rem;">
                          ${r.true_cluster_id !== null ? `ID: ${r.true_cluster_id}` : '<span style="color: #10b981;">New</span>'}
                        </td>
                      ` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  toggleCluster(clusterId) {
    if (this.expandedClusterIds.has(clusterId)) {
      this.expandedClusterIds.delete(clusterId);
    } else {
      this.expandedClusterIds.add(clusterId);
    }
    const el = document.getElementById(`cluster-${clusterId}`);
    if (el) {
      el.classList.toggle('expanded');
    }
  },

  expandAll() {
    this.currentClusters.forEach(c => this.expandedClusterIds.add(c.cluster_id));
    this.applyFilters();
  },

  collapseAll() {
    this.expandedClusterIds.clear();
    this.applyFilters();
  },

  clearFilters() {
    const searchEl = document.getElementById('cluster-search');
    const deptEl = document.getElementById('filter-dept');
    const statusEl = document.getElementById('filter-status');
    const priorityEl = document.getElementById('filter-priority');
    const recurringEl = document.getElementById('filter-recurring');
    if (searchEl) searchEl.value = '';
    if (deptEl) deptEl.value = '';
    if (statusEl) statusEl.value = '';
    if (priorityEl) priorityEl.value = '';
    if (recurringEl) recurringEl.checked = false;
    this.applyFilters();
    window.App && window.App.showToast('Filters cleared', 'info');
  },

  async handleStatusChange(clusterId) {
    const select = document.getElementById(`status-select-${clusterId}`);
    const newStatus = select.value;
    const note = prompt(`Enter resolution notes for Cluster #${clusterId} (or leave blank):`, `Issue status updated to ${newStatus} by department staff.`);

    try {
      await API.updateClusterStatus(clusterId, newStatus, note || undefined);
      window.App.showToast(`Cluster #${clusterId} marked as ${newStatus}`, 'success');
      await this.loadData();
    } catch (err) {
      console.error(err);
      window.App.showToast(`Failed to update status: ${err.message}`, 'danger');
    }
  },

  exportCSV() {
    window.open('/api/export', '_blank');
    window.App.showToast('Downloading clustered complaints CSV...', 'info');
  }
};

window.ClustersView = ClustersView;
