/**
 * Campus Problem Intelligence (CPI 360) - Lightweight Dynamic SVG Visualizations
 */

const Charts = {
  renderTimelineChart(containerId, timelineData) {
    const container = document.getElementById(containerId);
    if (!container || !timelineData || timelineData.length === 0) return;

    const width = container.clientWidth || 600;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 40, left: 40 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxCount = Math.max(...timelineData.map(d => d.count), 5);
    const n = timelineData.length;

    // Generate points
    const points = timelineData.map((d, i) => {
      const x = padding.left + (i / (n - 1)) * chartW;
      const y = padding.top + chartH - (d.count / maxCount) * chartH;
      return { x, y, date: d.date, count: d.count };
    });

    const pathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      // Smooth curve
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x},${padding.top + chartH} L ${points[0].x},${padding.top + chartH} Z`;

    // Format dates for X-axis (every 3rd or 4th label)
    const xLabels = points.filter((_, idx) => idx % Math.ceil(n / 6) === 0 || idx === n - 1).map(p => {
      const parts = p.date.split('-');
      const shortDate = parts.length >= 3 ? `${parts[1]}/${parts[2]}` : p.date;
      return `<text x="${p.x}" y="${height - 10}" fill="#64748b" font-size="11" text-anchor="middle" font-family="JetBrains Mono">${shortDate}</text>`;
    }).join('');

    // Grid lines for Y-axis
    const yGrid = [0, Math.round(maxCount / 2), maxCount].map(val => {
      const y = padding.top + chartH - (val / maxCount) * chartH;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />
        <text x="${padding.left - 8}" y="${y + 4}" fill="#64748b" font-size="11" text-anchor="end" font-family="JetBrains Mono">${val}</text>
      `;
    }).join('');

    // Interactive point circles
    const circles = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#06b6d4" stroke="#080c14" stroke-width="2" class="chart-point" data-date="${p.date}" data-count="${p.count}">
        <title>${p.date}: ${p.count} complaint(s)</title>
      </circle>
    `).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${yGrid}
        <path d="${areaD}" fill="url(#areaGradient)" />
        <path d="${pathD}" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" />
        ${circles}
        ${xLabels}
      </svg>
    `;
  },

  renderDepartmentBars(containerId, deptStats) {
    const container = document.getElementById(containerId);
    if (!container || !deptStats) return;

    const depts = Object.entries(deptStats);
    if (depts.length === 0) return;

    const maxReports = Math.max(...depts.map(([_, s]) => s.total_reports), 1);

    container.innerHTML = depts.map(([name, stat]) => {
      const pct = Math.round((stat.total_reports / maxReports) * 100);
      const resPct = stat.total_issues > 0 ? Math.round((stat.resolved / stat.total_issues) * 100) : 0;
      return `
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 5px;">
            <span style="font-weight: 600; color: #f1f5f9;">${name}</span>
            <span style="color: #94a3b8; font-family: 'JetBrains Mono';">${stat.total_reports} reports (${stat.total_issues} clusters) &bull; <span style="color: #34d399;">${resPct}% resolved</span></span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; display: flex;">
            <div style="width: ${pct}%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.Charts = Charts;
