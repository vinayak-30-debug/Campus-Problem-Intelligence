import math
from typing import Tuple, List

HAZARD_KEYWORDS = [
    "danger", "dangerous", "fall", "shake", "shaking", "grind", "grinding",
    "injury", "trip", "tripped", "loose", "wheelchair", "ramp", "fire",
    "hazard", "shock", "aggressive", "dog", "bite", "unhygienic", "smell",
    "fused", "dark", "unsafe"
]

SEVERITY_WEIGHTS = {
    "High": 40.0,
    "Medium": 25.0,
    "Low": 12.0
}

def calculate_priority(
    severity: str,
    report_count: int,
    texts: List[str] = None
) -> Tuple[float, str]:
    """
    Calculate dynamic multi-factor priority score (0-100) and discrete priority level.
    
    Factors:
    1. Base severity weight (High=40, Medium=25, Low=12)
    2. Frequency / Near-duplicate surge: 15 * log2(count) up to 45 pts
    3. Safety / Hazard keyword presence: up to 15 pts
    """
    # 1. Base severity
    base = SEVERITY_WEIGHTS.get(severity, 25.0)
    
    # 2. Duplicate Frequency surge
    if report_count > 1:
        freq_boost = min(45.0, 15.0 * math.log2(float(report_count)))
    else:
        freq_boost = 0.0
        
    # 3. Hazard boost
    hazard_boost = 0.0
    if texts:
        combined_text = " ".join(texts).lower()
        matched_hazards = [kw for kw in HAZARD_KEYWORDS if kw in combined_text]
        if matched_hazards:
            hazard_boost = min(15.0, len(matched_hazards) * 5.0)
            
    total_score = min(100.0, round(base + freq_boost + hazard_boost, 1))
    
    # Classify into discrete priority tier
    if total_score >= 75.0 or (report_count >= 5 and severity in ["High", "Medium"]):
        level = "CRITICAL"
    elif total_score >= 50.0 or (report_count >= 3):
        level = "HIGH"
    elif total_score >= 28.0:
        level = "MEDIUM"
    else:
        level = "LOW"
        
    return total_score, level
