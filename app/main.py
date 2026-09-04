import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any

from app.models import (
    ComplaintReport,
    ComplaintCreateRequest,
    ClusterGroup,
    ClusterStatusUpdateRequest,
    IntelligenceResponse,
    BenchmarkReport
)
from app.db import db_manager

app = FastAPI(
    title="Campus Problem Intelligence (CPI 360)",
    description="PS5: Campus Problem Intelligence Platform - Autonomous Near-Duplicate Detection, Multi-Factor Prioritization, Routing & Resolution Tracking",
    version="1.0.0"
)

# Enable CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- API Endpoints -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Campus Problem Intelligence",
        "ai_model": "all-MiniLM-L6-v2",
        "total_reports": len(db_manager.reports),
        "total_clusters": len(db_manager.clusters)
    }

@app.get("/api/reports", response_model=List[ComplaintReport])
def get_reports(
    category: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    cluster_id: Optional[int] = None,
    search: Optional[str] = None
):
    """Retrieve all reports with optional filtering."""
    raw_reports = db_manager.get_all_reports(
        category=category,
        department=department,
        status=status,
        severity=severity,
        cluster_id=cluster_id,
        search=search
    )
    return [ComplaintReport(**r) for r in raw_reports]

@app.post("/api/reports", response_model=IntelligenceResponse)
def submit_report(payload: ComplaintCreateRequest):
    """
    Submit a new student complaint:
    - Generates semantic embeddings
    - Identifies near-duplicate issues / cluster matching
    - Auto-infers category & department
    - Dynamically escalates priority based on frequency
    - Returns instant intelligence breakdown
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty.")

    return db_manager.add_complaint(
        text=payload.text.strip(),
        category=payload.category,
        department=payload.department,
        location=payload.location,
        severity=payload.severity or "Medium",
        reported_by=payload.reported_by or "student.demo@college.edu"
    )

@app.get("/api/clusters", response_model=List[ClusterGroup])
def get_clusters(
    department: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    recurring_only: bool = False
):
    """Retrieve clustered recurring and individual campus issues."""
    raw_clusters = db_manager.get_all_clusters(
        department=department,
        status=status,
        priority=priority,
        recurring_only=recurring_only
    )
    return [ClusterGroup(**c) for c in raw_clusters]

@app.get("/api/clusters/{cluster_id}", response_model=ClusterGroup)
def get_cluster_details(cluster_id: int):
    """Retrieve a single cluster by ID with its constituent reports."""
    cluster = db_manager.get_cluster_by_id(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster #{cluster_id} not found.")
    return ClusterGroup(**cluster)

@app.patch("/api/clusters/{cluster_id}/status", response_model=ClusterGroup)
def update_cluster_status(cluster_id: int, payload: ClusterStatusUpdateRequest):
    """
    Update cluster status (Open, In Progress, Resolved) with resolution notes.
    Cascades status change to all linked student reports.
    """
    if payload.status not in ["Open", "In Progress", "Resolved"]:
        raise HTTPException(status_code=400, detail="Status must be 'Open', 'In Progress', or 'Resolved'.")

    updated = db_manager.update_cluster_status(
        cluster_id=cluster_id,
        new_status=payload.status,
        notes=payload.resolution_notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Cluster #{cluster_id} not found.")
    return ClusterGroup(**updated)

@app.get("/api/analytics")
def get_analytics():
    """Retrieve aggregate analytics, timeline trends, and department workloads."""
    return db_manager.get_analytics()

@app.get("/api/benchmark", response_model=BenchmarkReport)
def get_benchmark():
    """Evaluate clustering accuracy (NMI, ARI, duplicate detection F1) against ground truth."""
    return db_manager.get_benchmark_report()

@app.post("/api/reset")
def reset_seed():
    """Reset dataset back to pristine 56 seed complaints state for live demos."""
    return db_manager.reset_database()

@app.get("/api/export")
def export_csv():
    """Export current clustered reports as CSV."""
    import io
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "report_id", "assigned_cluster_id", "cluster_title", "text", "category",
        "department", "location", "severity", "status", "timestamp", "reported_by"
    ])
    for r in db_manager.reports:
        writer.writerow([
            r["report_id"], r["assigned_cluster_id"], r.get("cluster_title", ""),
            r["text"], r["category"], r["department"], r["location"],
            r["severity"], r["status"], r["timestamp"], r["reported_by"]
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=campus_complaints_clustered.csv"}
    )

# ----------------- Static Frontend Mounting -----------------
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
if os.path.exists(PUBLIC_DIR):
    app.mount("/css", StaticFiles(directory=os.path.join(PUBLIC_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(PUBLIC_DIR, "js")), name="js")

@app.get("/")
def serve_index():
    index_file = os.path.join(PUBLIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Campus Problem Intelligence API is running. Place frontend in /public."}
