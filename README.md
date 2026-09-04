# 🧠 Campus Problem Intelligence (CPI 360)

> **Campusathon 2026 — Problem Statement 5: Campus Problem Intelligence Platform**  
> *Autonomous Near-Duplicate Detection, Multi-Factor Prioritization, Department Routing, and Resolution Tracking powered by AI Semantic Embeddings.*

---

## 📌 Problem Overview

On modern university campuses, hundreds of students report similar or identical issues independently (e.g., library Wi-Fi dropping, broken classroom fans, hostel washroom uncleanliness, portal errors). Traditional helpdesk and ticketing systems treat every submission as an isolated ticket. This creates:

1. **Ticket Noise & Duplication:** Support teams waste hours reviewing 30 different tickets for the same broken air conditioner or router.
2. **Hidden Severity & Safety Hazards:** Critical safety issues (such as wobbling ceiling fans or loose wiring) get lost in a flat queue instead of being escalated as reports accumulate.
3. **Misrouted Complaints:** Students often select incorrect departments or categories, causing administrative delays.
4. **No Unified Resolution:** Closing one ticket leaves 20 other duplicate tickets open, frustrating students and obscuring real resolution rates.

**CPI 360** transforms unstructured student complaints into an actionable, deduplicated intelligence pipeline using dense vector semantic embeddings and automated priority escalation.

---

## ✨ Key Features

- **🔍 Autonomous Near-Duplicate Detection:** Converts student complaints into 384-dimensional dense semantic vectors using `all-MiniLM-L6-v2`, matching paraphrased reports via cosine similarity with category-aware boosting.
- **🎯 Dynamic Problem Clustering:** Uses hierarchical agglomerative clustering to group related issues into unified, manageable problem clusters with auto-generated titles.
- **⚡ Multi-Factor Priority Escalation:** Dynamic priority scoring (0–100) combining base severity, logarithmic frequency surge ($15 \times \log_2(\text{count})$), and safety hazard keyword scanning.
- **🏢 Intelligent Department Routing:** Automated categorization across 8 campus domains (*Wi-Fi/Network*, *Infrastructure*, *Hygiene*, *Academics*, *Sports*, *Transport*, *Safety*, *Accessibility*) and routing to the responsible campus department or administrative cell.
- **📊 Executive Problem Intelligence Dashboard:** Real-time KPI summary cards, incident timeline trends across August 2026, departmental load distribution, and location hotspots.
- **📈 Ground-Truth Accuracy Benchmark:** Built-in evaluation dashboard computing Normalized Mutual Information (NMI), Adjusted Rand Index (ARI), and pairwise precision/recall/F1 against labeled ground-truth data.
- **🎯 1-Click Live Demo Presets:** Pre-configured paraphrased complaint scenarios to instantly demonstrate near-duplicate merging, hazard escalation, and novel issue registration.
- **🔄 Cascading Resolution & Auto-Reopen:** Resolving a cluster resolves all linked student complaints; receiving a new report on a resolved issue automatically re-opens the cluster.
- **⚖️ Judge Mode vs. Dev Mode:** One-click toggle in the top bar to switch between production view and developer view (exposing ground-truth labels and test badges).
- **📥 CSV Export & Instant Reset:** Export clustered complaints to CSV or restore the database to the pristine 56 seed reports at any time.

---

## 🏛️ System Architecture

For an in-depth technical architecture breakdown, see [architecture.md](file:///d:/Campus%20Hack/architecture.md).

```
                      [ Incoming Student Complaint ]
                                    │
                                    ▼
                     [ Category & Department Router ]
                                    │
                                    ▼
                     [ AI Semantic Embedding Engine ]
                        (all-MiniLM-L6-v2 • 384d)
                                    │
                                    ▼
                     [ Real-Time Cosine Deduplication ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
         [ Near-Duplicate Match ]            [ Distinct New Issue ]
                  │                                   │
                  ▼                                   ▼
      • Merge into Active Cluster         • Spawn New Problem Cluster
      • Increment Report Count            • Auto-generate Cluster Title
      • Logarithmic Priority Surge        • Route to Responsible Dept
      • Hazard Keyword Scan               • Set Initial Priority Tier
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
                    [ In-Memory Database State Manager ]
                                    │
                                    ▼
          [ CPI 360 Glassmorphic Executive Dashboard & SPA Views ]
```

---

## 📁 Project Structure

```
Campus Hack/
├── app/                                 # Backend Application (FastAPI)
│   ├── __init__.py
│   ├── ai_engine.py                     # Semantic embeddings, clustering & deduplication
│   ├── benchmark.py                     # ARI, NMI, and Pairwise F1 benchmark evaluation
│   ├── db.py                            # In-memory database manager & analytics engine
│   ├── main.py                          # FastAPI application & REST endpoints
│   ├── models.py                        # Pydantic schemas and typed data models
│   ├── priority_engine.py               # Multi-factor dynamic priority scoring
│   └── router_engine.py                 # Keyword taxonomy & department router
│
├── public/                              # Frontend Single Page Application
│   ├── css/
│   │   └── style.css                    # Dark glassmorphic design system
│   ├── js/
│   │   ├── api.js                       # Asynchronous REST API client
│   │   ├── app.js                       # SPA controller, hash router, and mode toggle
│   │   ├── charts.js                    # Zero-dependency native SVG charting engine
│   │   └── views/
│   │       ├── dashboard.js             # Executive KPI & analytics view
│   │       ├── submit.js                # Complaint reporting & live demo presets
│   │       ├── clusters.js              # Clustered issues matrix & report threads
│   │       ├── department.js            # Department SLA & resolution tracking
│   │       └── benchmark.js             # Ground-truth accuracy validation suite
│   └── index.html                       # Main HTML application shell
│
├── campus_complaints_dataset.csv        # Seed dataset (56 complaints across 15 ground-truth clusters)
├── run_server.py                        # Uvicorn server launcher with Windows optimizations
├── architecture.md                      # Detailed technical architecture document
└── README.md                            # Comprehensive project overview and documentation
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Python 3.10+**
- Modern Web Browser (Chrome, Firefox, Edge, Safari)

### 2. Install Required Packages
```bash
pip install fastapi uvicorn sentence-transformers scikit-learn numpy pydantic
```

> **Note:** If `sentence-transformers` is not present, CPI 360 includes an automated fallback to Scikit-Learn TF-IDF vectorization so the application continues to run seamlessly.

### 3. Launch the Application
```bash
python run_server.py
```

The server will start at:
```
http://127.0.0.1:8000
```

Open your browser and navigate to `http://127.0.0.1:8000` to access the CPI 360 dashboard.

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, embedding model info, and item counts |
| `GET` | `/api/reports` | Retrieve reports with optional filters (`category`, `department`, `status`, `severity`, `cluster_id`, `search`) |
| `POST` | `/api/reports` | Submit a new complaint; triggers real-time deduplication, priority recalculation, and clustering |
| `GET` | `/api/clusters` | List all problem clusters with filters (`department`, `status`, `priority`, `recurring_only`) |
| `GET` | `/api/clusters/{id}` | Detailed view of a single cluster and all its constituent student reports |
| `PATCH`| `/api/clusters/{id}/status` | Update cluster status (`Open`, `In Progress`, `Resolved`) with cascading resolution |
| `GET` | `/api/analytics` | Aggregate analytics, KPI metrics, timeline trends, and department workloads |
| `GET` | `/api/benchmark` | Accuracy benchmark metrics (NMI, ARI, Pairwise Precision/Recall/F1) against ground truth |
| `POST` | `/api/reset` | Reset the database back to the pristine 56 seed complaints |
| `GET` | `/api/export` | Download a CSV export of all reports with assigned cluster metadata |

---

## 🧪 Live Demo Walkthrough (For Judges & Evaluators)

Navigate to the **Report & Live Demo** tab (`#submit`) to evaluate the AI clustering capabilities using the 1-click test chips:

1. **Paraphrase Wi-Fi Test (`library_wifi`):**
   - Click the preset: *"library wifi drops constantly"*.
   - **Result:** Detected as a near-duplicate (~85% similarity) and merged into **Issue #1 (Central Library Wi-Fi)**. Report count increments and priority escalates.
2. **Safety Hazard Fan Test (`fan_b204`):**
   - Click the preset: *"fan in room B-204 wobbles and shakes dangerously"*.
   - **Result:** High similarity match to **Issue #3**. The priority engine detects the hazard keyword *"shakes dangerously"*, triggering immediate escalation to **CRITICAL**.
3. **Canteen Hygiene Test (`canteen_tables`):**
   - Click the preset: *"canteen dining tables sticky with food leftovers"*.
   - **Result:** Automatically classified under **Hygiene**, routed to **Housekeeping**, and merged into the active Canteen cluster.
4. **Novel Issue Test (`new_issue`):**
   - Click the preset: *"severe water leakage in Chemistry Lab 3 ceiling"*.
   - **Result:** Similarity falls below threshold; CPI 360 creates a **brand-new problem cluster**, auto-titles it, and assigns it to **Maintenance**.
5. **Resolution Cascading Test:**
   - In the **Recurring Issues** tab (`#clusters`), mark a cluster as **Resolved**.
   - Expanding the cluster reveals that all member student reports have transitioned to **Resolved**.
   - Submitting a new complaint for that same problem automatically **re-opens** the issue with an audit note.
6. **Reset State:**
   - Click **🔄 Reset Seed DB** in the top bar to instantly restore the database to its initial 56 seed reports.

---

## 📊 Benchmark & Accuracy Metrics

Under the **Accuracy Benchmark** tab (`#benchmark`), CPI 360 provides transparent, quantitative validation against the ground-truth dataset:

- **Normalized Mutual Information (NMI):** Quantifies mutual information shared between AI clusters and ground-truth classes.
- **Adjusted Rand Index (ARI):** Measures clustering agreement corrected for chance.
- **Pairwise Precision & Recall:** Evaluates whether pairs of complaints belonging to the same root problem are correctly grouped together without over-merging.
- **Noise Reduction %:** Percentage of raw student complaints successfully consolidated into actionable problem clusters.

---

## 🛠️ Technology Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn
- **AI / Machine Learning:** Sentence-Transformers (`all-MiniLM-L6-v2`), Scikit-Learn (`AgglomerativeClustering`), NumPy
- **Data Validation:** Pydantic v2
- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Glassmorphic Design), Vanilla ES6+ JavaScript
- **Data Visualization:** Native SVG Charting (Zero third-party library overhead)
- **Dataset:** Curated 56-complaint dataset with labeled ground truth ([`campus_complaints_dataset.csv`](file:///d:/Campus%20Hack/campus_complaints_dataset.csv))

---

## 📄 License

Developed for **Campusathon 2026**. All rights reserved.
