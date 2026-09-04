/**
 * CPI 360 - Department Workflow & SLA Resolution Queue View
 */

const DepartmentView = {
  currentDept: 'IT Services',
  clusters: [],

  departments: [
    'IT Services',
    'Maintenance',
    'Housekeeping',
    'Academic Office',
    'Examination Cell',
    'Sports Department',
    'Transport Office',
    'Security Office',
    'Accounts Office'
  ],

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Department Work Queue & SLA</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 4px;">
            Targeted administrative triage queue. Resolving a cluster marks all constituent student tickets as resolved and notifies reporters.
          </p>
        </div>
      </div>

      <!-- Department Tabs Header -->
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 24px;">
        ${this.departments.map(d => `
          <button 
            type="button" 
            class="btn ${d === this.currentDept ? 'btn-primary' : 'btn-secondary'}" 
            style="white-space: nowrap; font-size: 0.82rem;"
            onclick="DepartmentView.selectDept('${d}')"
            id="dept-tab-${d.replace(/\s+/g, '')}"
          >
            🏢 ${d}
          </button>
        `).join('')}
      </div>

      <!-- Department Header KPI Card -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff;" id="dept-heading">
              ${this.currentDept} Action Queue
            </h3>
            <p style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 2px;" id="dept-subheading">
              Loading queue status...
            </p>
          </div>
          <div style="display: flex; gap: 12px;" id="dept-kpi-badges"></div>
        </div>
      </div>

      <!-- Department Issues Queue Grid -->
      <div id="dept-issues-grid" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          Loading department issues...
        </div>
      </div>
    `;

    await this.loadData();
  },

  async selectDept(dept) {
    this.currentDept = dept;
    this.departments.forEach(d => {
      const btn = document.getElementById(`dept-tab-${d.replace(/\s+/g, '')}`);
      if (btn) {
        if (d === dept) {
          btn.className = 'btn btn-primary';
        } else {
          btn.className = 'btn btn-secondary';
        }
      }
    });
    document.getElementById('dept-heading').textContent = `${dept} Action Queue`;
    await this.loadData();
  },

  async loadData() {
    try {
      this.clusters = await API.getClusters({ department: this.currentDept });
      this.renderQueue();
    } catch (err) {
      console.error(err);
      window.App.showToast('Failed to load department queue', 'danger');
    }
  },

  renderQueue() {
    const grid = document.getElementById('dept-issues-grid');
    const badges = document.getElementById('dept-kpi-badges');
    const subheading = document.getElementById('dept-subheading');

    if (!grid) return;

    const total = this.clusters.length;
    const resolved = this.clusters.filter(c => c.status === 'Resolved').length;
    const inProgress = this.clusters.filter(c => c.status === 'In Progress').length;
    const open = this.clusters.filter(c => c.status === 'Open').length;
    const critical = this.clusters.filter(c => c.priority_level === 'CRITICAL' && c.status !== 'Resolved').length;

    subheading.textContent = `Managing ${total} cluster(s) containing ${this.clusters.reduce((acc, c) => acc + c.report_count, 0)} total student complaints.`;

    badges.innerHTML = `
      <span class="status-badge status-Open">Open: ${open}</span>
      <span class="status-badge status-InProgress">In Progress: ${inProgress}</span>
      <span class="status-badge status-Resolved">Resolved: ${resolved}</span>
      ${critical > 0 ? `<span class="priority-badge priority-CRITICAL">🔥 ${critical} Critical</span>` : ''}
    `;

    if (this.clusters.length === 0) {
      grid.innerHTML = `
        <div class="card" style="text-align: center; padding: 50px; color: var(--text-muted);">
          No active problem clusters assigned to ${this.currentDept}.
        </div>
      `;
      return;
    }

    grid.innerHTML = this.clusters.map(c => `
      <div class="card ${c.priority_level.toLowerCase()}-border" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span class="cluster-id-badge">#${c.cluster_id}</span>
              <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff;">${c.title}</h4>
              <span class="status-badge status-${c.status.replace(/\s+/g, '')}">${c.status}</span>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); display: flex; gap: 12px; align-items: center;">
              <span>📍 ${c.location}</span>
              <span>&bull;</span>
              <span>🏷️ ${c.category}</span>
              <span>&bull;</span>
              <span class="duplicate-count-badge" style="font-size: 0.72rem; padding: 2px 7px;">
                ${c.report_count} complaints merged
              </span>
            </div>
          </div>

          <div style="text-align: right;">
            <div class="priority-badge priority-${c.priority_level}">
              ${c.priority_level} (${c.priority_score} pts)
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
              Last report: ${c.last_reported}
            </div>
          </div>
        </div>

        <!-- Sample Paraphrased Complaint Quotes -->
        <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">
            Student Complaint Paraphrases (${c.reports.length}):
          </div>
          <ul style="padding-left: 18px; font-size: 0.85rem; color: #cbd5e1;">
            ${c.reports.slice(0, 3).map(r => `<li style="margin-bottom: 4px;">"${r.text}" <span style="color: var(--text-muted); font-size: 0.75rem;">(${r.reported_by})</span></li>`).join('')}
            ${c.reports.length > 3 ? `<li style="color: var(--accent-cyan); font-weight: 600;">+ ${c.reports.length - 3} more near-duplicate reports grouped</li>` : ''}
          </ul>
        </div>

        ${c.resolution_notes ? `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 10px; font-size: 0.84rem; color: #a7f3d0; margin-bottom: 14px;">
            <strong>Resolution Log:</strong> ${c.resolution_notes}
          </div>
        ` : ''}

        <!-- Resolution Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
          ${c.status !== 'In Progress' && c.status !== 'Resolved' ? `
            <button class="btn btn-secondary" onclick="DepartmentView.updateStatus(${c.cluster_id}, 'In Progress')">
              🛠️ Start Work (In Progress)
            </button>
          ` : ''}
          ${c.status !== 'Resolved' ? `
            <button class="btn btn-primary" style="background: linear-gradient(135deg, #059669, #10b981);" onclick="DepartmentView.promptResolve(${c.cluster_id})">
              ✅ Mark Resolved & Notify ${c.report_count} Students
            </button>
          ` : `
            <button class="btn btn-secondary" onclick="DepartmentView.updateStatus(${c.cluster_id}, 'Open')">
              🔄 Reopen Ticket
            </button>
          `}
        </div>
      </div>
    `).join('');
  },

  async promptResolve(clusterId) {
    const note = prompt(`Enter resolution summary for Cluster #${clusterId} (sent to students):`, 'Technician dispatched and repair completed. Verified operational.');
    if (note !== null) {
      await this.updateStatus(clusterId, 'Resolved', note);
    }
  },

  async updateStatus(clusterId, newStatus, notes = '') {
    try {
      await API.updateClusterStatus(clusterId, newStatus, notes || undefined);
      window.App.showToast(`Cluster #${clusterId} status updated to ${newStatus}`, 'success');
      await this.loadData();
    } catch (err) {
      console.error(err);
      window.App.showToast(`Failed to update status: ${err.message}`, 'danger');
    }
  }
};

window.DepartmentView = DepartmentView;
