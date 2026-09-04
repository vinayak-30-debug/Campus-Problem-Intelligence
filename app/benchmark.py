import numpy as np
from typing import List, Dict, Any
from sklearn.metrics import (
    adjusted_rand_score,
    normalized_mutual_info_score,
    homogeneity_score,
    completeness_score
)
from app.models import BenchmarkReport, BenchmarkMetric

def run_clustering_benchmark(
    reports: List[Dict[str, Any]],
    predicted_labels: List[int]
) -> BenchmarkReport:
    """
    Benchmark predicted clusters against ground truth true_cluster_id.
    """
    total_reports = len(reports)
    true_labels = [0 if r.get('true_cluster_id') is None else int(r['true_cluster_id']) for r in reports]
    
    # Standard clustering metrics
    ari = float(adjusted_rand_score(true_labels, predicted_labels))
    nmi = float(normalized_mutual_info_score(true_labels, predicted_labels))
    homogeneity = float(homogeneity_score(true_labels, predicted_labels))
    completeness = float(completeness_score(true_labels, predicted_labels))
    
    # Ground truth duplicate pairs evaluation
    # Two reports (i, j) are true duplicate if true_labels[i] == true_labels[j] and true_labels[i] != 0
    N = len(reports)
    true_pairs = set()
    pred_pairs = set()
    
    for i in range(N):
        for j in range(i + 1, N):
            if true_labels[i] != 0 and true_labels[i] == true_labels[j]:
                true_pairs.add((i, j))
            if predicted_labels[i] == predicted_labels[j]:
                pred_pairs.add((i, j))
                
    tp = len(pred_pairs.intersection(true_pairs))
    fp = len(pred_pairs - true_pairs)
    fn = len(true_pairs - pred_pairs)
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    unique_pred = len(set(predicted_labels))
    unique_true = len(set(true_labels))
    
    # Deduplication noise reduction: how many reports were bundled into clusters
    reduction_pct = round(((total_reports - unique_pred) / total_reports) * 100.0, 1) if total_reports > 0 else 0.0
    
    metrics = [
        BenchmarkMetric(
            metric_name="Normalized Mutual Information (NMI)",
            score=round(nmi, 4),
            description="Measures mutual information shared between predicted clusters and true ground truth (0 to 1 scale)."
        ),
        BenchmarkMetric(
            metric_name="Adjusted Rand Index (ARI)",
            score=round(ari, 4),
            description="Similarity measure between two clusterings adjusted for chance (1.0 is perfect clustering)."
        ),
        BenchmarkMetric(
            metric_name="Near-Duplicate Pair Precision",
            score=round(precision, 4),
            description="Percentage of detected duplicate pairs that actually belong to the exact same underlying issue."
        ),
        BenchmarkMetric(
            metric_name="Near-Duplicate Pair Recall",
            score=round(recall, 4),
            description="Percentage of all real near-duplicate pairs correctly discovered and grouped by AI."
        ),
        BenchmarkMetric(
            metric_name="Duplicate Detection F1-Score",
            score=round(f1, 4),
            description="Harmonic mean of pairwise precision and recall for duplicate detection."
        ),
        BenchmarkMetric(
            metric_name="Homogeneity Score",
            score=round(homogeneity, 4),
            description="Assesses if each predicted cluster contains only data points of a single true class."
        ),
        BenchmarkMetric(
            metric_name="Completeness Score",
            score=round(completeness, 4),
            description="Assesses if all data points of a given true class are assigned to the same cluster."
        )
    ]
    
    return BenchmarkReport(
        total_reports=total_reports,
        ground_truth_clusters=unique_true,
        predicted_clusters=unique_pred,
        ari_score=round(ari, 4),
        nmi_score=round(nmi, 4),
        pairwise_precision=round(precision, 4),
        pairwise_recall=round(recall, 4),
        pairwise_f1=round(f1, 4),
        duplicate_noise_reduction_percent=reduction_pct,
        metrics=metrics
    )
