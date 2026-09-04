/**
 * CPI 360 - Main Application Controller
 */

const App = {
  currentView: 'dashboard',
  isJudgeMode: false,

  views: {
    dashboard: DashboardView,
    submit: SubmitView,
    clusters: ClustersView,
    department: DepartmentView,
    benchmark: BenchmarkView
  },

  init() {
    console.log('[CPI 360] Initializing application...');

    // Load saved Judge Mode preference
    const savedMode = localStorage.getItem('cpi_judge_mode');
    if (savedMode !== null) {
      this.isJudgeMode = savedMode === 'true';
    }
    this.updateJudgeModeUI();

    // Check URL hash for initial route
    const hash = window.location.hash.replace('#', '');
    if (this.views[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }

    // Refresh live counts in sidebar
    this.updateSidebarCounts();

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
      submit: 'Report an Issue & Live AI Grouping Demo',
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
    this.isJudgeMode = !this.isJudgeMode;
    localStorage.setItem('cpi_judge_mode', this.isJudgeMode);
    this.updateJudgeModeUI();

    if (this.isJudgeMode) {
      this.showToast('Judge Mode ON: Ground-truth test columns hidden.', 'info');
    } else {
      this.showToast('Dev Mode ON: Ground-truth validation visible.', 'info');
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
      if (this.isJudgeMode) {
        toggleBtn.classList.add('active');
        toggleBtn.querySelector('.judge-mode-label').textContent = 'Judge Mode (Active)';
      } else {
        toggleBtn.classList.remove('active');
        toggleBtn.querySelector('.judge-mode-label').textContent = 'Dev Mode (Testing)';
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
