/**
 * CPI 360 - Interactive Student Report & Live Demo View
 */

const SubmitView = {
  render(container) {
    container.innerHTML = `
      <div style="max-width: 840px; margin: 0 auto;">
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Report Campus Problem</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 4px;">
            Submit a campus complaint. CPI 360 uses AI semantic embeddings to automatically recognize near-duplicates, prevent redundant ticketing, and escalate recurring hazards.
          </p>
        </div>

        <!-- 1-Click Live Demo Presets Box -->
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

        <!-- Submission Form Card -->
        <div class="card">
          <form id="report-form" onsubmit="SubmitView.handleSubmit(event)">
            <div class="form-group">
              <label class="form-label" for="report-text">
                Problem Description <span style="color: #ef4444;">*</span>
              </label>
              <textarea 
                id="report-text" 
                class="form-textarea" 
                placeholder="Describe the issue in detail (e.g., 'Unable to stay connected to Wi-Fi in the reading hall...')" 
                required
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="report-category">Category</label>
                <select id="report-category" class="form-input">
                  <option value="">Auto-Detect via AI Engine</option>
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
                <label class="form-label" for="report-location">Location / Building</label>
                <input 
                  type="text" 
                  id="report-location" 
                  class="form-input" 
                  placeholder="e.g. Central Library, 2nd Floor"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="report-severity">Severity</label>
                <select id="report-severity" class="form-input">
                  <option value="Medium">Medium (Standard campus defect)</option>
                  <option value="High">High (Immediate disturbance / Safety hazard)</option>
                  <option value="Low">Low (Minor cosmetic issue)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="reported-by">Reporter Student ID / Email</label>
                <input 
                  type="email" 
                  id="reported-by" 
                  class="form-input" 
                  value="student.demo@college.edu" 
                  required
                />
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
              <button type="button" class="btn btn-secondary" onclick="SubmitView.clearForm()">
                Clear
              </button>
              <button type="submit" class="btn btn-primary" id="btn-submit-report">
                <span>🚀</span> Submit & Run AI Intelligence
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Live AI Intelligence Inspection Modal -->
      <div id="ai-modal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title-box">
              <span class="ai-pulse-icon">🧠</span>
              <div>
                <h3>AI Problem Intelligence Diagnostics</h3>
                <p style="font-size: 0.78rem; color: var(--text-secondary);">Real-Time Semantic Deduplication & Triage</p>
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
    window.App.showToast('Demo preset loaded! Click Submit to run AI clustering.', 'info');
  },

  clearForm() {
    document.getElementById('report-form').reset();
  },

  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-report');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Processing AI Embedding...';

    const payload = {
      text: document.getElementById('report-text').value,
      category: document.getElementById('report-category').value || undefined,
      location: document.getElementById('report-location').value || undefined,
      severity: document.getElementById('report-severity').value,
      reported_by: document.getElementById('reported-by').value
    };

    try {
      const response = await API.submitComplaint(payload);
      this.displayIntelligenceModal(response);
      window.App.showToast('Complaint analyzed & indexed by AI', 'success');
    } catch (err) {
      console.error(err);
      window.App.showToast(`Error: ${err.message}`, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>🚀</span> Submit & Run AI Intelligence';
    }
  },

  displayIntelligenceModal(intel) {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-modal-content');
    const simPct = Math.round((intel.similarity_score || 0) * 100);

    const isMatch = intel.action_taken === 'MERGED_EXISTING_CLUSTER';

    content.innerHTML = `
      <div class="ai-step-timeline">
        <!-- Step 1: Embedding Vectorization -->
        <div class="ai-step-card">
          <div class="step-label">Step 1: NLP Vector Encoding</div>
          <div class="step-title">384-Dimensional Semantic Embedding Generated</div>
          <p style="font-size: 0.84rem; color: var(--text-secondary);">
            Model: <code class="mono" style="color: var(--accent-cyan);">sentence-transformers/all-MiniLM-L6-v2</code>
          </p>
          <div style="font-size: 0.78rem; font-family: 'JetBrains Mono'; color: var(--text-muted); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            [0.0421, -0.0891, 0.0342, 0.1145, -0.0612, 0.0784, 0.0129, ...]
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
