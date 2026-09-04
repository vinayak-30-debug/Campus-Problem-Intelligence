/**
 * Campus Problem Intelligence (CPI 360) - API Client
 */

const API = {
  async getAnalytics() {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to load analytics');
    return await res.json();
  },

  async getReports(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const res = await fetch(`/api/reports?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load reports');
    return await res.json();
  },

  async getClusters(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const res = await fetch(`/api/clusters?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load clusters');
    return await res.json();
  },

  async getClusterById(id) {
    const res = await fetch(`/api/clusters/${id}`);
    if (!res.ok) throw new Error(`Failed to load cluster #${id}`);
    return await res.json();
  },

  async submitComplaint(data) {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit complaint');
    }
    return await res.json();
  },

  async updateClusterStatus(id, status, notes = '') {
    const res = await fetch(`/api/clusters/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution_notes: notes })
    });
    if (!res.ok) throw new Error('Failed to update cluster status');
    return await res.json();
  },

  async getBenchmark() {
    const res = await fetch('/api/benchmark');
    if (!res.ok) throw new Error('Failed to load benchmark');
    return await res.json();
  },

  async resetDatabase() {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    return await res.json();
  }
};

window.API = API;
