/**
 * CPI 360 - Main Application Controller
 * Keyboard Shortcuts:
 *   G + D  → Dashboard        G + S  → Submit Report
 *   G + C  → Clusters         G + P  → Departments
 *   G + R  → Latest Reports   G + B  → Benchmark
 *   /      → Focus cluster search
 *   E      → Expand all       X      → Collapse all
 *   Esc    → Clear filters    ?      → Toggle shortcut help
 */

const App = {
  currentView: 'dashboard',
  isDevMode: false,
  isLightMode: false,
  healthData: null,

  get isJudgeMode() {
    return !this.isDevMode;
  },
  set isJudgeMode(val) {
    this.isDevMode = !val;
  },

  views: {
    dashboard: DashboardView,
    submit: SubmitView,
    reports: ReportsView,
    clusters: ClustersView,
    department: DepartmentView,
    benchmark: BenchmarkView
  },

  init() {
    console.log('[CPI 360] Initializing application...');

    // Load saved Dev Mode preference (defaults to false for normal student experience)
    const savedMode = localStorage.getItem('cpi_dev_mode');
    if (savedMode !== null) {
      this.isDevMode = savedMode === 'true';
    } else {
      this.isDevMode = false;
    }
    this.updateJudgeModeUI();

    // Load saved theme (defaults to system preference)
    const savedTheme = localStorage.getItem('cpi_theme');
    if (savedTheme) {
      this.isLightMode = savedTheme === 'light';
    } else {
      this.isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    this.updateThemeUI();

    // Check URL hash for initial route
    const hash = window.location.hash.replace('#', '');
    if (this.views[hash] && !(hash === 'benchmark' && !this.isDevMode)) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }

    // Refresh live counts & health status in sidebar
    this.updateSidebarCounts();
    this.updateHealthStatus();

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (this.views[h] && h !== this.currentView) {
        if (h === 'benchmark' && !this.isDevMode) {
          this.showToast('Accuracy Benchmark is only available in Dev Mode.', 'info');
          window.location.hash = this.currentView;
          return;
        }
        this.navigateTo(h);
      }
    });
    // Global keyboard shortcuts
    this._gPressed = false;
    this._gTimer = null;
    document.addEventListener('keydown', (e) => this._handleKeydown(e));
  },

  _handleKeydown(e) {
    // Skip if user is typing in an input/textarea
    const tag = e.target.tagName;
    const inInput = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

    // ? — toggle keyboard help (always, even in inputs)
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.toggleShortcutHelp();
      return;
    }

    // Escape — clear cluster filters or close modals
    if (e.key === 'Escape') {
      const helpModal = document.getElementById('shortcut-help-modal');
      if (helpModal && helpModal.classList.contains('open')) {
        helpModal.classList.remove('open');
        return;
      }
      if (this.currentView === 'clusters' && typeof ClustersView !== 'undefined') {
        ClustersView.clearFilters();
      }
      return;
    }

    if (inInput) return;

    // / — focus cluster search
    if (e.key === '/') {
      e.preventDefault();
      if (this.currentView !== 'clusters') {
        this.navigateTo('clusters').then(() => {
          setTimeout(() => {
            const searchEl = document.getElementById('cluster-search');
            if (searchEl) { searchEl.focus(); searchEl.select(); }
          }, 350);
        });
      } else {
        const searchEl = document.getElementById('cluster-search');
        if (searchEl) { searchEl.focus(); searchEl.select(); }
      }
      return;
    }

    // E — expand all clusters
    if (e.key === 'e' || e.key === 'E') {
      if (this.currentView === 'clusters' && typeof ClustersView !== 'undefined') {
        ClustersView.expandAll();
        this.showToast('All clusters expanded', 'info');
      }
      return;
    }

    // X — collapse all clusters
    if (e.key === 'x' || e.key === 'X') {
      if (this.currentView === 'clusters' && typeof ClustersView !== 'undefined') {
        ClustersView.collapseAll();
        this.showToast('All clusters collapsed', 'info');
      }
      return;
    }

    // G + letter — navigation chords
    if (e.key === 'g' || e.key === 'G') {
      this._gPressed = true;
      if (this._gTimer) clearTimeout(this._gTimer);
      this._gTimer = setTimeout(() => { this._gPressed = false; }, 1200);
      return;
    }

    if (this._gPressed) {
      this._gPressed = false;
      if (this._gTimer) clearTimeout(this._gTimer);
      const navMap = { d: 'dashboard', s: 'submit', r: 'reports', c: 'clusters', p: 'department', b: 'benchmark' };
      const dest = navMap[e.key.toLowerCase()];
      if (dest) {
        // Block G+B shortcut when Dev Mode is off
        if (dest === 'benchmark' && !this.isDevMode) {
          this.showToast('Accuracy Benchmark is only available in Dev Mode.', 'info');
          return;
        }
        e.preventDefault();
        this.navigateTo(dest);
        const labels = { dashboard: 'Dashboard', submit: 'Submit Report', reports: 'Latest Reports', clusters: 'Clusters', department: 'Departments', benchmark: 'Benchmark' };
        this.showToast(`Navigated to ${labels[dest]}`, 'info');
      }
    }
  },

  toggleShortcutHelp() {
    let modal = document.getElementById('shortcut-help-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'shortcut-help-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:520px">
          <div class="modal-header">
            <div class="modal-title-box">
              <span class="ai-pulse-icon">⌨️</span>
              <h3>Keyboard Shortcuts</h3>
            </div>
            <button class="btn-close" onclick="document.getElementById('shortcut-help-modal').classList.remove('open')">✕</button>
          </div>
          <div class="modal-body">
            <div class="shortcut-grid">
              <div class="shortcut-section">
                <div class="shortcut-section-title">Navigation</div>
                <div class="shortcut-row"><kbd>G</kbd><kbd>D</kbd><span>Dashboard</span></div>
                <div class="shortcut-row"><kbd>G</kbd><kbd>S</kbd><span>Submit Report</span></div>
                <div class="shortcut-row"><kbd>G</kbd><kbd>R</kbd><span>Latest Reports</span></div>
                <div class="shortcut-row"><kbd>G</kbd><kbd>C</kbd><span>Clusters Matrix</span></div>
                <div class="shortcut-row"><kbd>G</kbd><kbd>P</kbd><span>Departments</span></div>
                <div class="shortcut-row"><kbd>G</kbd><kbd>B</kbd><span>Benchmark</span></div>
              </div>
              <div class="shortcut-section">
                <div class="shortcut-section-title">Clusters View</div>
                <div class="shortcut-row"><kbd>/</kbd><span>Focus search bar</span></div>
                <div class="shortcut-row"><kbd>E</kbd><span>Expand all clusters</span></div>
                <div class="shortcut-row"><kbd>X</kbd><span>Collapse all clusters</span></div>
                <div class="shortcut-row"><kbd>Esc</kbd><span>Clear all filters</span></div>
              </div>
              <div class="shortcut-section">
                <div class="shortcut-section-title">Global</div>
                <div class="shortcut-row"><kbd>?</kbd><span>Toggle this panel</span></div>
              </div>
            </div>
          </div>
        </div>
      `;
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) modal.classList.remove('open');
      });
      document.body.appendChild(modal);
    }
    modal.classList.toggle('open');
  },

  async navigateTo(viewName, params = {}) {
    if (!this.views[viewName]) return;
    this.currentView = viewName;
    window.location.hash = viewName;

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update topbar title
    const titles = {
      dashboard: 'Executive Problem Intelligence Dashboard',
      submit: 'Report a Campus Problem',
      reports: 'Latest Reports Feed',
      clusters: 'Recurring Issues Matrix & Deduplication',
      department: 'Department Workflows & SLA Resolution',
      benchmark: 'AI Clustering Accuracy & Ground Truth Validation'
    };
    const titleEl = document.getElementById('current-page-title');
    if (titleEl) titleEl.textContent = titles[viewName] || 'Campus Problem Intelligence';

    // Render view
    const container = document.getElementById('view-container');
    if (container) {
      await this.views[viewName].render(container, params);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  toggleTheme() {
    this.isLightMode = !this.isLightMode;
    localStorage.setItem('cpi_theme', this.isLightMode ? 'light' : 'dark');
    this.updateThemeUI();
    this.showToast(this.isLightMode ? '☀️ Light mode enabled' : '🌙 Dark mode enabled', 'info');
  },

  updateThemeUI() {
    const root = document.documentElement;
    if (this.isLightMode) {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    const icon  = document.getElementById('theme-toggle-icon');
    const label = document.getElementById('theme-toggle-label');
    if (icon)  icon.textContent  = this.isLightMode ? '☀️' : '🌙';
    if (label) label.textContent = this.isLightMode ? 'Dark Mode' : 'Light Mode';
  },

  toggleJudgeMode() {
    this.isDevMode = !this.isDevMode;
    localStorage.setItem('cpi_dev_mode', this.isDevMode);
    this.updateJudgeModeUI();

    if (this.isDevMode) {
      this.showToast('Dev Mode ON: Hackathon presets & AI diagnostics enabled.', 'info');
    } else {
      this.showToast('Dev Mode OFF: Student campus reporting mode active.', 'info');
    }

    // Re-render current view if relevant
    const container = document.getElementById('view-container');
    if (container && this.views[this.currentView]) {
      this.views[this.currentView].render(container);
    }
  },

  updateJudgeModeUI() {
    const toggleBtn = document.getElementById('topbar-judge-toggle');
    if (toggleBtn) {
      if (this.isDevMode) {
        toggleBtn.classList.add('active');
        const label = toggleBtn.querySelector('.judge-mode-label');
        if (label) label.textContent = 'Dev Mode: ON';
      } else {
        toggleBtn.classList.remove('active');
        const label = toggleBtn.querySelector('.judge-mode-label');
        if (label) label.textContent = 'Dev Mode: OFF';
      }
    }

    // Show/hide the Accuracy Benchmark nav tab based on Dev Mode
    const benchmarkNav = document.getElementById('nav-benchmark');
    if (benchmarkNav) {
      benchmarkNav.style.display = this.isDevMode ? '' : 'none';
    }

    // If Dev Mode was just turned off and user is on benchmark, redirect to dashboard
    if (!this.isDevMode && this.currentView === 'benchmark') {
      this.navigateTo('dashboard');
    }
  },

  async handleResetDatabase() {
    if (!confirm('Reset dataset back to the pristine 56 seed complaints? All live demo submissions will be cleared.')) {
      return;
    }

    try {
      await API.resetDatabase();
      this.showToast('Database reset to original 56 seed reports!', 'success');
      await this.updateSidebarCounts();
      await this.updateHealthStatus();
      const container = document.getElementById('view-container');
      if (container && this.views[this.currentView]) {
        this.views[this.currentView].render(container);
      }
    } catch (err) {
      console.error(err);
      this.showToast(`Failed to reset: ${err.message}`, 'danger');
    }
  },

  async updateSidebarCounts() {
    try {
      const analytics = await API.getAnalytics();
      const clustersBadge = document.getElementById('sidebar-clusters-badge');
      const reportsBadge = document.getElementById('sidebar-reports-badge');
      if (clustersBadge) clustersBadge.textContent = analytics.total_clusters;
      if (reportsBadge) reportsBadge.textContent = analytics.total_reports;
    } catch (e) {
      // Ignore initial silent error
    }
  },

  async updateHealthStatus() {
    try {
      this.healthData = await API.getHealth();
      const modelTag = document.getElementById('sidebar-ai-model');
      if (modelTag && this.healthData) {
        if (this.healthData.lightweight_mode) {
          modelTag.innerHTML = `TF-IDF &bull; Lightweight`;
        } else {
          const modelName = this.healthData.ai_model || 'all-MiniLM-L6-v2';
          modelTag.innerHTML = `${modelName} &bull; 384d`;
        }
      }
      return this.healthData;
    } catch (e) {
      console.warn('[CPI 360] Could not fetch health status:', e);
      const modelTag = document.getElementById('sidebar-ai-model');
      if (modelTag) modelTag.textContent = 'AI Engine Active';
      return null;
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'danger' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
