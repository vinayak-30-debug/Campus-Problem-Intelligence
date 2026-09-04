import csv
import os
import copy
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from app.models import ComplaintReport, ClusterGroup, IntelligenceResponse, BenchmarkReport
from app.ai_engine import AIEngine
from app.priority_engine import calculate_priority
from app.router_engine import infer_category_and_department
from app.benchmark import run_clustering_benchmark

# Resolve dataset path relative to repository root regardless of current working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_CSV_PATH = str(PROJECT_ROOT / "campus_complaints_dataset.csv")

class DatabaseManager:
    def __init__(self, csv_path: Optional[str] = None):
        if csv_path and os.path.exists(csv_path):
            self.csv_path = csv_path
        elif os.path.exists(DATASET_CSV_PATH):
            self.csv_path = DATASET_CSV_PATH
        else:
            self.csv_path = csv_path or "campus_complaints_dataset.csv"

        self.ai_engine = AIEngine()
        self.reports: List[Dict[str, Any]] = []
        self.clusters: Dict[int, Dict[str, Any]] = {}
        self.next_report_id_counter = 100
        self.next_cluster_id_counter = 100
        self.load_seed_data()

    def load_seed_data(self):
        """
        Load dataset from CSV, execute AI clustering, and initialize priority and routing.
        """
        print(f"[DB] Loading seed dataset from {self.csv_path}...", flush=True)
        if not os.path.exists(self.csv_path):
            if os.path.exists(DATASET_CSV_PATH):
                self.csv_path = DATASET_CSV_PATH
            else:
                raise FileNotFoundError(f"Cannot find dataset file: {self.csv_path} (checked {DATASET_CSV_PATH})")

        raw_rows = []
        with open(self.csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_rows.append({
                    "report_id": row["report_id"],
                    "text": row["text"],
                    "category": row["category"],
                    "department": row["department"],
                    "location": row["location"],
                    "severity": row["severity"],
                    "status": row["status"],
                    "timestamp": row["timestamp"],
                    "reported_by": row["reported_by"],
                    "true_cluster_id": int(row["true_cluster_id"]) if row.get("true_cluster_id") else 0
                })

        texts = [r["text"] for r in raw_rows]
        categories = [r["category"] for r in raw_rows]

        # Cluster using AI engine
        # We use distance threshold 0.48 which groups near-duplicates and isolates one-offs
        predicted_cluster_labels = self.ai_engine.cluster_reports(
            texts=texts,
            categories=categories,
            distance_threshold=0.48
        )

        # Normalize predicted labels to 1-indexed cluster IDs
        label_map = {}
        next_cid = 1
        for lbl in predicted_cluster_labels:
            if lbl not in label_map:
                label_map[lbl] = next_cid
                next_cid += 1

        assigned_cluster_ids = [label_map[lbl] for lbl in predicted_cluster_labels]

        # Build reports collection
        self.reports = []
        self.clusters = {}

        for idx, row in enumerate(raw_rows):
            cid = assigned_cluster_ids[idx]
            rep = copy.deepcopy(row)
            rep["assigned_cluster_id"] = cid
            self.reports.append(rep)

            if cid not in self.clusters:
                self.clusters[cid] = {
                    "cluster_id": cid,
                    "title": "",
                    "category": rep["category"],
                    "department": rep["department"],
                    "location": rep["location"],
                    "severity": rep["severity"],
                    "status": rep["status"],
                    "reports": [],
                    "first_reported": rep["timestamp"],
                    "last_reported": rep["timestamp"],
                    "resolution_notes": ""
                }
            self.clusters[cid]["reports"].append(rep)
            # Track time range
            if rep["timestamp"] < self.clusters[cid]["first_reported"]:
                self.clusters[cid]["first_reported"] = rep["timestamp"]
            if rep["timestamp"] > self.clusters[cid]["last_reported"]:
                self.clusters[cid]["last_reported"] = rep["timestamp"]

        # Post-process clusters: Title, aggregate status, multi-factor priority
        for cid, cl in self.clusters.items():
            c_reports = cl["reports"]
            c_texts = [r["text"] for r in c_reports]

            # True cluster ID if all share or majority
            true_cids = [r["true_cluster_id"] for r in c_reports if r["true_cluster_id"] != 0]
            majority_true = max(set(true_cids), key=true_cids.count) if true_cids else None

            cl["title"] = self.ai_engine.generate_cluster_title(
                cluster_id=cid,
                texts=c_texts,
                category=cl["category"],
                location=cl["location"],
                true_cluster_id=majority_true
            )

            # Assign cluster title back to reports
            for r in c_reports:
                r["cluster_title"] = cl["title"]

            # Aggregate severity: highest of member reports
            sev_levels = [r["severity"] for r in c_reports]
            if "High" in sev_levels:
                cl["severity"] = "High"
            elif "Medium" in sev_levels:
                cl["severity"] = "Medium"
            else:
                cl["severity"] = "Low"

            # Aggregate status: If all resolved -> Resolved. If any In Progress -> In Progress. Else Open.
            statuses = [r["status"] for r in c_reports]
            if all(s == "Resolved" for s in statuses):
                cl["status"] = "Resolved"
            elif any(s == "In Progress" for s in statuses):
                cl["status"] = "In Progress"
            else:
                cl["status"] = "Open"

            # Multi-factor priority calculation
            p_score, p_level = calculate_priority(
                severity=cl["severity"],
                report_count=len(c_reports),
                texts=c_texts
            )
            cl["priority_score"] = p_score
            cl["priority_level"] = p_level
            cl["report_count"] = len(c_reports)
            cl["is_recurring"] = len(c_reports) > 1

        self.next_cluster_id_counter = max(self.clusters.keys()) + 1
        print(f"[DB] Initialized {len(self.reports)} reports grouped into {len(self.clusters)} clusters.", flush=True)

    def get_all_reports(
        self,
        category: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        cluster_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = self.reports
        if category:
            results = [r for r in results if r["category"].lower() == category.lower()]
        if department:
            results = [r for r in results if r["department"].lower() == department.lower()]
        if status:
            results = [r for r in results if r["status"].lower() == status.lower()]
        if severity:
            results = [r for r in results if r["severity"].lower() == severity.lower()]
        if cluster_id is not None:
            results = [r for r in results if r["assigned_cluster_id"] == cluster_id]
        if search:
            q = search.lower()
            results = [r for r in results if q in r["text"].lower() or q in r["location"].lower() or q in r["report_id"].lower()]
        return results

    def get_all_clusters(
        self,
        department: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        recurring_only: bool = False
    ) -> List[Dict[str, Any]]:
        results = list(self.clusters.values())
        if department:
            results = [c for c in results if c["department"].lower() == department.lower()]
        if status:
            results = [c for c in results if c["status"].lower() == status.lower()]
        if priority:
            results = [c for c in results if c["priority_level"].lower() == priority.lower()]
        if recurring_only:
            results = [c for c in results if c["is_recurring"]]
            
        # Sort by priority score descending, then report count descending
        results.sort(key=lambda x: (0 if x["status"] == "Resolved" else 1, x["priority_score"], x["report_count"]), reverse=True)
        return results

    def get_cluster_by_id(self, cluster_id: int) -> Optional[Dict[str, Any]]:
        return self.clusters.get(cluster_id)

    def add_complaint(
        self,
        text: str,
        category: Optional[str] = None,
        department: Optional[str] = None,
        location: Optional[str] = None,
        severity: Optional[str] = "Medium",
        reported_by: Optional[str] = "student.demo@college.edu"
    ) -> IntelligenceResponse:
        """
        Process incoming student complaint in real-time:
        1. Auto-infer category & department if needed
        2. Compute embedding & find near-duplicate matching cluster
        3. Either merge into existing cluster (escalating priority) OR create new cluster
        4. Return instant AI intelligence payload for UI visualization
        """
        inferred_cat, inferred_dept = infer_category_and_department(text, category, department)
        chosen_loc = location.strip() if location and location.strip() else "Campus General"
        chosen_sev = severity if severity in ["Low", "Medium", "High"] else "Medium"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

        self.next_report_id_counter += 1
        new_report_id = f"RPT{self.next_report_id_counter:04d}"

        # Existing corpus for semantic matching
        existing_texts = [r["text"] for r in self.reports]
        existing_cats = [r["category"] for r in self.reports]
        existing_cids = [r["assigned_cluster_id"] for r in self.reports]

        matched_cid, sim_score, matched_idx, matched_text = self.ai_engine.find_best_match(
            query_text=text,
            query_category=inferred_cat,
            existing_texts=existing_texts,
            existing_categories=existing_cats,
            existing_cluster_ids=existing_cids,
            threshold=0.58
        )

        matched_report_id = self.reports[matched_idx]["report_id"] if matched_idx is not None else None

        if matched_cid and matched_cid in self.clusters:
            # Merged into existing cluster!
            cluster = self.clusters[matched_cid]
            prev_count = len(cluster["reports"])
            prev_priority = cluster["priority_level"]

            new_rep = {
                "report_id": new_report_id,
                "text": text,
                "category": cluster["category"],
                "department": cluster["department"],
                "location": cluster["location"] if chosen_loc == "Campus General" else chosen_loc,
                "severity": chosen_sev,
                "status": "Open",
                "timestamp": now_str,
                "reported_by": reported_by,
                "true_cluster_id": None,
                "assigned_cluster_id": matched_cid,
                "cluster_title": cluster["title"],
                "similarity_score": round(sim_score, 4)
            }

            self.reports.append(new_rep)
            cluster["reports"].append(new_rep)
            cluster["last_reported"] = now_str
            cluster["report_count"] = len(cluster["reports"])
            cluster["is_recurring"] = True

            # If cluster was resolved, re-open it since a new complaint arrived!
            if cluster["status"] == "Resolved":
                cluster["status"] = "Open"
                cluster["resolution_notes"] += f" [Reopened on {now_str} due to new report]"

            # Recalculate priority
            all_c_texts = [r["text"] for r in cluster["reports"]]
            new_p_score, new_p_level = calculate_priority(
                severity=cluster["severity"],
                report_count=cluster["report_count"],
                texts=all_c_texts
            )
            cluster["priority_score"] = new_p_score
            cluster["priority_level"] = new_p_level

            action_msg = f"Near-duplicate match detected ({round(sim_score * 100, 1)}% similarity)! Grouped into active Issue #{matched_cid}."
            if prev_priority != new_p_level:
                action_msg += f" Priority automatically escalated from {prev_priority} to {new_p_level}."

            return IntelligenceResponse(
                report=ComplaintReport(**new_rep),
                matched_cluster_id=matched_cid,
                cluster_title=cluster["title"],
                is_recurring=True,
                similarity_score=round(sim_score, 4),
                matched_report_id=matched_report_id,
                matched_text=matched_text,
                previous_report_count=prev_count,
                new_report_count=cluster["report_count"],
                previous_priority=prev_priority,
                new_priority=new_p_level,
                priority_score=new_p_score,
                department_assigned=cluster["department"],
                action_taken="MERGED_EXISTING_CLUSTER",
                message=action_msg
            )
        else:
            # Create NEW cluster!
            new_cid = self.next_cluster_id_counter
            self.next_cluster_id_counter += 1

            new_rep = {
                "report_id": new_report_id,
                "text": text,
                "category": inferred_cat,
                "department": inferred_dept,
                "location": chosen_loc,
                "severity": chosen_sev,
                "status": "Open",
                "timestamp": now_str,
                "reported_by": reported_by,
                "true_cluster_id": None,
                "assigned_cluster_id": new_cid,
                "cluster_title": "",
                "similarity_score": round(sim_score, 4)
            }

            title = self.ai_engine.generate_cluster_title(
                cluster_id=new_cid,
                texts=[text],
                category=inferred_cat,
                location=chosen_loc
            )
            new_rep["cluster_title"] = title

            p_score, p_level = calculate_priority(
                severity=chosen_sev,
                report_count=1,
                texts=[text]
            )

            new_cluster = {
                "cluster_id": new_cid,
                "title": title,
                "category": inferred_cat,
                "department": inferred_dept,
                "location": chosen_loc,
                "severity": chosen_sev,
                "priority_level": p_level,
                "priority_score": p_score,
                "status": "Open",
                "report_count": 1,
                "reports": [new_rep],
                "first_reported": now_str,
                "last_reported": now_str,
                "resolution_notes": "",
                "is_recurring": False
            }

            self.reports.append(new_rep)
            self.clusters[new_cid] = new_cluster

            return IntelligenceResponse(
                report=ComplaintReport(**new_rep),
                matched_cluster_id=new_cid,
                cluster_title=title,
                is_recurring=False,
                similarity_score=round(sim_score, 4),
                matched_report_id=None,
                matched_text=None,
                previous_report_count=0,
                new_report_count=1,
                previous_priority="NONE",
                new_priority=p_level,
                priority_score=p_score,
                department_assigned=inferred_dept,
                action_taken="CREATED_NEW_CLUSTER",
                message=f"No matching near-duplicate found (highest similarity was {round(sim_score * 100, 1)}%). Registered as a distinct new issue and assigned to {inferred_dept}."
            )

    def update_cluster_status(self, cluster_id: int, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Update status for an entire cluster group and cascade to all member reports.
        """
        if cluster_id not in self.clusters:
            return None
            
        cluster = self.clusters[cluster_id]
        cluster["status"] = new_status
        if notes is not None:
            cluster["resolution_notes"] = notes
            
        # Cascade status update to all constituent reports
        for r in cluster["reports"]:
            r["status"] = new_status
            
        return cluster

    def get_analytics(self) -> Dict[str, Any]:
        """
        Aggregate analytics for the Executive Dashboard.
        """
        total_reports = len(self.reports)
        total_clusters = len(self.clusters)
        recurring_clusters = sum(1 for c in self.clusters.values() if c["is_recurring"])
        
        # Deduplication rate
        duplicate_reports_merged = total_reports - total_clusters
        dedup_rate = round((duplicate_reports_merged / total_reports * 100.0), 1) if total_reports > 0 else 0.0

        # Status breakdown
        status_counts = {"Open": 0, "In Progress": 0, "Resolved": 0}
        for c in self.clusters.values():
            s = c.get("status", "Open")
            if s in status_counts:
                status_counts[s] += 1
            else:
                status_counts[s] = 1

        resolved_count = status_counts.get("Resolved", 0)
        resolution_rate = round((resolved_count / total_clusters * 100.0), 1) if total_clusters > 0 else 0.0

        # Priority breakdown
        priority_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for c in self.clusters.values():
            p = c.get("priority_level", "MEDIUM")
            priority_counts[p] = priority_counts.get(p, 0) + 1

        # Department breakdown
        dept_stats = {}
        for c in self.clusters.values():
            d = c["department"]
            if d not in dept_stats:
                dept_stats[d] = {"total_issues": 0, "total_reports": 0, "resolved": 0, "open": 0, "in_progress": 0}
            dept_stats[d]["total_issues"] += 1
            dept_stats[d]["total_reports"] += c["report_count"]
            if c["status"] == "Resolved":
                dept_stats[d]["resolved"] += 1
            elif c["status"] == "In Progress":
                dept_stats[d]["in_progress"] += 1
            else:
                dept_stats[d]["open"] += 1

        # Category breakdown
        category_counts = {}
        for r in self.reports:
            cat = r["category"]
            category_counts[cat] = category_counts.get(cat, 0) + 1

        # Timeline trend across August 2026 (daily counts)
        daily_counts = {}
        for r in self.reports:
            ts = r["timestamp"]
            date_str = ts.split(" ")[0] if " " in ts else ts
            daily_counts[date_str] = daily_counts.get(date_str, 0) + 1

        # Sort timeline by date
        sorted_timeline = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]

        # Location hotspots
        location_counts = {}
        for r in self.reports:
            loc = r["location"]
            location_counts[loc] = location_counts.get(loc, 0) + 1
        sorted_locations = sorted(
            [{"location": k, "count": v} for k, v in location_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:8]

        return {
            "total_reports": total_reports,
            "total_clusters": total_clusters,
            "recurring_clusters": recurring_clusters,
            "isolated_reports": total_clusters - recurring_clusters,
            "duplicate_reports_merged": duplicate_reports_merged,
            "deduplication_rate_percent": dedup_rate,
            "resolution_rate_percent": resolution_rate,
            "status_breakdown": status_counts,
            "priority_breakdown": priority_counts,
            "department_breakdown": dept_stats,
            "category_breakdown": category_counts,
            "timeline_trend": sorted_timeline,
            "location_hotspots": sorted_locations
        }

    def get_benchmark_report(self) -> BenchmarkReport:
        """
        Run full benchmark comparing predicted cluster labels with true_cluster_id.
        """
        predicted_labels = [r["assigned_cluster_id"] for r in self.reports]
        return run_clustering_benchmark(self.reports, predicted_labels)

    def reset_database(self):
        """
        Reset database back to the original virgin seed CSV state.
        """
        self.next_report_id_counter = 100
        self.next_cluster_id_counter = 100
        self.load_seed_data()
        return {"status": "success", "message": "Database successfully restored to original seed dataset."}

# Global singleton database instance
db_manager = DatabaseManager()
