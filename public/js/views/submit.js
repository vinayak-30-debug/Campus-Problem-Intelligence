/**
 * CPI 360 - Student Campus Problem Reporting View
 */

const SubmitView = {
  render(container) {
    const isDevMode = window.App?.isDevMode ?? false;

    container.innerHTML = `
      <div style="max-width: 820px; margin: 0 auto;">
        <!-- Page Header -->
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 1.65rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Report a Campus Problem</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 6px; line-height: 1.5;">
            Tell us what's wrong and we'll route it to the right team.
          </p>
        </div>

        ${isDevMode ? `
          <!-- 1-Click Live Demo Presets Box (Visible only when Dev Mode is ON) -->
          <div class="demo-presets-box">
            <div class="presets-header">
              <span>🎯</span>
              <span>Live Hackathon Demo Presets (1-Click Paraphrase Tests)</span>
            </div>
            <div class="preset-chips-row">
              <button type="button" class="preset-chip" onclick="SubmitView.fillPreset('library_wifi')">
                ⚡ Paraphrase: "library wifi drops constantly"
              </button>
              <button type="button" class="preset-chip" onclick="SubmitView.fillPreset('fan_b204')">
                ⚡ Paraphrase: "fan in room B-204 wobbles and shakes dangerously"
              </button>
              <button type="button" class="preset-chip" onclick="SubmitView.fillPreset('canteen_tables')">
                ⚡ Paraphrase: "canteen dining tables sticky with food leftovers"
              </button>
              <button type="button" class="preset-chip" onclick="SubmitView.fillPreset('bus_route')">
                ⚡ Paraphrase: "bus route 4 delayed 35 minutes again this morning"
              </button>
              <button type="button" class="preset-chip" onclick="SubmitView.fillPreset('new_issue')">
                ✨ Novel Issue: "severe water leakage in Chemistry Lab 3 ceiling"
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Submission Form Card -->
        <div class="student-form-card">
          <form id="report-form" onsubmit="SubmitView.handleSubmit(event)">
            <div class="form-group">
              <label class="form-label" for="report-text">
                What happened? <span style="color: #ef4444;">*</span>
              </label>
              <textarea 
                id="report-text" 
                class="form-textarea" 
                placeholder="Describe the problem in your own words..." 
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="report-location">Where did this happen?</label>
              <input 
                type="text" 
                id="report-location" 
                class="form-input" 
                placeholder="e.g. Central Library, 2nd Floor"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="report-category">Problem type</label>
                <select id="report-category" class="form-input">
                  <option value="">Auto-detect</option>
                  <option value="Wi-Fi / Network">Wi-Fi / Network</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Hygiene">Hygiene</option>
                  <option value="Academics">Academics</option>
                  <option value="Sports Facilities">Sports Facilities</option>
                  <option value="Transport">Transport</option>
                  <option value="Safety">Safety</option>
                  <option value="Accessibility">Accessibility</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="report-severity">How serious is the problem?</label>
                <select id="report-severity" class="form-input">
                  <option value="Low">Low</option>
                  <option value="Medium" selected>Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reported-by">
                Your college email <span style="color: #ef4444;">*</span>
              </label>
              <input 
                type="email" 
                id="reported-by" 
                class="form-input" 
                value="student.demo@college.edu" 
                placeholder="student@college.edu"
                required
              />
            </div>

            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 14px; margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn btn-secondary" onclick="SubmitView.clearForm()" style="padding: 11px 20px;">
                Clear
              </button>
              <button type="submit" class="btn btn-primary" id="btn-submit-report" style="padding: 12px 28px; font-weight: 700; font-size: 0.95rem;">
                Submit Problem
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Live AI Intelligence Inspection / Student Confirmation Modal -->
      <div id="ai-modal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <span class="ai-pulse-icon" id="modal-title-icon">🧠</span>
              <div>
                <h3 id="modal-title-text">AI Problem Intelligence Diagnostics</h3>
                <p id="modal-title-sub" style="font-size: 0.78rem; color: var(--text-secondary);">Real-Time Semantic Deduplication & Triage</p>
              </div>
            </div>
            <button class="btn-close" onclick="SubmitView.closeModal()">&times;</button>
          </div>
          <div class="modal-body" id="ai-modal-content">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>
    `;
  },

  fillPreset(type) {
    const textEl = document.getElementById('report-text');
    const catEl = document.getElementById('report-category');
    const locEl = document.getElementById('report-location');
    const sevEl = document.getElementById('report-severity');

    if (type === 'library_wifi') {
      textEl.value = 'library wifi drops constantly';
      catEl.value = 'Wi-Fi / Network';
      locEl.value = 'Central Library';
      sevEl.value = 'High';
    } else if (type === 'fan_b204') {
      textEl.value = 'the fan in room B-204 is shaking violently and making rattling sounds, could fall';
      catEl.value = 'Infrastructure';
      locEl.value = 'Academic Block B, 2nd Floor';
      sevEl.value = 'High';
    } else if (type === 'canteen_tables') {
      textEl.value = 'canteen tables are very sticky and full of leftover food and no one cleans them';
      catEl.value = 'Hygiene';
      locEl.value = 'Canteen';
      sevEl.value = 'Medium';
    } else if (type === 'bus_route') {
      textEl.value = 'college bus on route 4 is delayed by 35 minutes again this morning';
      catEl.value = 'Transport';
      locEl.value = 'Route 4 - City Bus';
      sevEl.value = 'Medium';
    } else if (type === 'new_issue') {
      textEl.value = 'severe water leakage dripping from the ceiling in Chemistry Lab 3, creating puddles near electrical outlets';
      catEl.value = 'Infrastructure';
      locEl.value = 'Science Block, Chemistry Lab 3';
      sevEl.value = 'High';
    }

    textEl.focus();
    window.App.showToast('Demo preset loaded! Click Submit to proceed.', 'info');
  },

  clearForm() {
    document.getElementById('report-form').reset();
  },

  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-report');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Submitting problem...';

    const payload = {
      text: document.getElementById('report-text').value,
      category: document.getElementById('report-category').value || undefined,
      location: document.getElementById('report-location').value || undefined,
      severity: document.getElementById('report-severity').value,
      reported_by: document.getElementById('reported-by').value
    };

    try {
      if (!window.App?.healthData) {
        window.App.healthData = await API.getHealth().catch(() => null);
      }
      const response = await API.submitComplaint(payload);
      this.displayIntelligenceModal(response);
      if (window.App?.isDevMode) {
        window.App.showToast('Complaint analyzed & indexed by AI', 'success');
      } else {
        window.App.showToast('Problem reported successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      window.App.showToast(`Error: ${err.message}`, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Submit Problem';
    }
  },

  displayIntelligenceModal(intel) {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-modal-content');
    const titleIcon = document.getElementById('modal-title-icon');
    const titleText = document.getElementById('modal-title-text');
    const titleSub = document.getElementById('modal-title-sub');

    const isDevMode = window.App?.isDevMode ?? false;

    if (!isDevMode) {
      // Normal Student Confirmation Experience
      if (titleIcon) titleIcon.textContent = '✅';
      if (titleText) titleText.textContent = 'Problem Reported';
      if (titleSub) titleSub.textContent = 'Your report has been logged and assigned';

      const isGrouped = intel.action_taken === 'MERGED_EXISTING_CLUSTER';
      const complaintId = intel.report?.report_id ? `#${intel.report.report_id}` : '#OPEN';
      const category = intel.report?.category || 'General';
      const location = intel.report?.location || 'Campus General';
      const department = intel.department_assigned || intel.report?.department || 'Campus Facilities';
      const status = intel.report?.status || 'Open';

      content.innerHTML = `
        <div class="student-confirmation-card">
          <div class="confirmation-banner">
            <span class="confirmation-banner-icon">✅</span>
            <h4>Problem reported successfully!</h4>
          </div>

          <div class="confirmation-details-card">
            <div class="confirmation-details-grid">
              <div class="confirmation-detail-item">
                <span class="confirmation-detail-label">Complaint ID</span>
                <span class="confirmation-detail-value mono" style="color: var(--accent-cyan);">${complaintId}</span>
              </div>
              <div class="confirmation-detail-item">
                <span class="confirmation-detail-label">Problem type</span>
                <span class="confirmation-detail-value">${category}</span>
              </div>
              <div class="confirmation-detail-item">
                <span class="confirmation-detail-label">Location</span>
                <span class="confirmation-detail-value">${location}</span>
              </div>
              <div class="confirmation-detail-item">
                <span class="confirmation-detail-label">Assigned team</span>
                <span class="confirmation-detail-value" style="color: #cbd5e1;">🏢 ${department}</span>
              </div>
              <div class="confirmation-detail-item">
                <span class="confirmation-detail-label">Status</span>
                <span class="confirmation-detail-value">
                  <span class="status-badge status-open" style="font-size: 0.78rem;">${status}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="confirmation-grouping-box">
            ${isGrouped ? `
              <div class="confirmation-grouping-header">
                <span>👥</span>
                <span>This problem is related to reports from other students.</span>
              </div>
              <p class="confirmation-grouping-text">
                <strong>${intel.new_report_count}</strong> similar reports have been grouped together so the campus team can address the issue efficiently.
              </p>
            ` : `
              <div class="confirmation-grouping-header">
                <span>📌</span>
                <span>This has been recorded as a new campus issue.</span>
              </div>
              <p class="confirmation-grouping-text">
                Our campus team has received your report and will take action.
              </p>
            `}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
            <button type="button" class="btn btn-primary" onclick="SubmitView.closeModal(); SubmitView.clearForm();" style="padding: 10px 24px;">
              Done
            </button>
          </div>
        </div>
      `;
    } else {
      // Developer / Judge Mode: Preserve Technical AI Diagnostics Experience
      if (titleIcon) titleIcon.textContent = '🧠';
      if (titleText) titleText.textContent = 'AI Problem Intelligence Diagnostics';
      if (titleSub) titleSub.textContent = 'Real-Time Semantic Deduplication & Triage';

      const simPct = Math.round((intel.similarity_score || 0) * 100);
      const isMatch = intel.action_taken === 'MERGED_EXISTING_CLUSTER';

      const health = window.App?.healthData;
      const isLightweight = health?.lightweight_mode ?? false;
      const modelDisplayName = isLightweight 
        ? (health?.ai_model || 'TF-IDF (Lightweight Embeddings)') 
        : (health?.ai_model ? `sentence-transformers/${health.ai_model}` : 'sentence-transformers/all-MiniLM-L6-v2');
      const stepTitle = isLightweight
        ? 'Sparse TF-IDF Feature Vector Generated'
        : '384-Dimensional Semantic Embedding Generated';
      const sampleVector = isLightweight
        ? '{"library": 0.482, "wifi": 0.519, "disconnect": 0.384, ...}'
        : '[0.0421, -0.0891, 0.0342, 0.1145, -0.0612, 0.0784, 0.0129, ...]';

      content.innerHTML = `
        <div class="ai-step-timeline">
          <!-- Step 1: Embedding Vectorization -->
          <div class="ai-step-card">
            <div class="step-label">Step 1: NLP Vector Encoding</div>
            <div class="step-title">${stepTitle}</div>
            <p style="font-size: 0.84rem; color: var(--text-secondary);">
              Model: <code class="mono" style="color: var(--accent-cyan);">${modelDisplayName}</code>
            </p>
            <div style="font-size: 0.78rem; font-family: 'JetBrains Mono'; color: var(--text-muted); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${sampleVector}
            </div>
          </div>

          <!-- Step 2: Semantic Similarity & Deduplication Matching -->
          <div class="ai-step-card ${isMatch ? 'matched' : ''}">
            <div class="step-label">Step 2: Semantic Similarity Matching</div>
            <div class="step-title" style="color: ${isMatch ? '#34d399' : '#38bdf8'};">
              ${isMatch ? `🎯 Near-Duplicate Match Detected (${simPct}% Similarity)` : `✨ No Near-Duplicate Found (${simPct}% Highest Sim)`}
            </div>
            <p style="font-size: 0.86rem; color: #f1f5f9; margin-bottom: 6px;">
              ${intel.message}
            </p>
            ${isMatch ? `
              <div style="background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06); margin-top: 8px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Matched Against Existing Report [${intel.matched_report_id}]:</div>
                <div style="font-size: 0.85rem; color: #e2e8f0; font-style: italic; margin-top: 2px;">"${intel.matched_text}"</div>
              </div>
            ` : ''}
            <div class="similarity-meter-bar">
              <div class="similarity-fill" style="width: ${simPct}%;"></div>
            </div>
          </div>

          <!-- Step 3: Cluster Assignment & Prioritization Escalation -->
          <div class="ai-step-card">
            <div class="step-label">Step 3: Multi-Factor Priority & Routing</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 8px;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Assigned Issue Cluster:</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #fff;">Cluster #${intel.matched_cluster_id}</div>
                <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 600;">${intel.cluster_title}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Responsible Department:</div>
                <div class="department-tag" style="margin-top: 4px;">🏢 ${intel.department_assigned}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Frequency Surge:</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">
                  ${intel.previous_report_count} &rarr; <span style="color: #38bdf8; font-size: 1.05rem;">${intel.new_report_count} reports</span>
                </div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Priority Level:</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                  ${intel.previous_priority !== 'NONE' ? `<span class="priority-badge priority-${intel.previous_priority}" style="font-size: 0.72rem;">${intel.previous_priority}</span> &rarr;` : ''}
                  <span class="priority-badge priority-${intel.new_priority}" style="font-size: 0.82rem;">${intel.new_priority}</span>
                  <span style="font-size: 0.75rem; font-family: 'JetBrains Mono'; color: var(--text-muted);">(${intel.priority_score} pts)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="SubmitView.closeModal()">
            Close
          </button>
          <button class="btn btn-primary" onclick="SubmitView.viewInMatrix(${intel.matched_cluster_id})">
            🔍 View Issue in Cluster Matrix
          </button>
        </div>
      `;
    }

    modal.classList.add('open');
  },

  closeModal() {
    document.getElementById('ai-modal').classList.remove('open');
  },

  viewInMatrix(clusterId) {
    this.closeModal();
    window.App.navigateTo('clusters', { highlightId: clusterId });
  }
};

window.SubmitView = SubmitView;

