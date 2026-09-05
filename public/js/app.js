/**
 * CPI 360 - Main Application Controller
 */

const App = {
  currentView: 'dashboard',
  isDevMode: false,
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

    // Check URL hash for initial route
    const hash = window.location.hash.replace('#', '');
    if (this.views[hash]) {
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
        this.navigateTo(h);
      }
    });
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
