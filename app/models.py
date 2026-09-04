from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ComplaintReport(BaseModel):
    report_id: str
    text: str
    category: str
    department: str
    location: str
    severity: str  # "Low", "Medium", "High"
    status: str    # "Open", "In Progress", "Resolved"
    timestamp: str # "YYYY-MM-DD HH:MM"
    reported_by: str
    true_cluster_id: Optional[int] = None
    assigned_cluster_id: Optional[int] = None
    cluster_title: Optional[str] = None
    similarity_score: Optional[float] = None

class ComplaintCreateRequest(BaseModel):
    text: str
    category: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    severity: Optional[str] = "Medium"
    reported_by: Optional[str] = "student.demo@college.edu"

class ClusterGroup(BaseModel):
    cluster_id: int
    title: str
    category: str
    department: str
    location: str
    severity: str
    priority_level: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    priority_score: float
    status: str          # "Open", "In Progress", "Resolved"
    report_count: int
    reports: List[ComplaintReport]
    first_reported: str
    last_reported: str
    resolution_notes: Optional[str] = ""
    is_recurring: bool = False
    ai_summary: Optional[str] = None

class ClusterStatusUpdateRequest(BaseModel):
    status: str  # "Open", "In Progress", "Resolved"
    resolution_notes: Optional[str] = None

class IntelligenceResponse(BaseModel):
    report: ComplaintReport
    matched_cluster_id: int
    cluster_title: str
    is_recurring: bool
    similarity_score: float
    matched_report_id: Optional[str] = None
    matched_text: Optional[str] = None
    previous_report_count: int
    new_report_count: int
    previous_priority: str
    new_priority: str
    priority_score: float
    department_assigned: str
    action_taken: str  # e.g., "Merged into existing cluster and escalated priority" or "Created new problem issue"
    message: str

class BenchmarkMetric(BaseModel):
    metric_name: str
    score: float
    description: str

class BenchmarkReport(BaseModel):
    total_reports: int
    ground_truth_clusters: int
    predicted_clusters: int
    ari_score: float
    nmi_score: float
    pairwise_precision: float
    pairwise_recall: float
    pairwise_f1: float
    duplicate_noise_reduction_percent: float
    metrics: List[BenchmarkMetric]
