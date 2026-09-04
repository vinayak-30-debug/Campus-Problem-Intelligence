import re
from typing import Tuple, Optional

CATEGORY_KEYWORDS = {
    "Wi-Fi / Network": ["wifi", "wi-fi", "internet", "network", "signal", "connection", "disconnect", "timing out", "band", "router", "speed"],
    "Infrastructure": ["fan", "light", "lights", "lamp", "tube", "water", "cooler", "elevator", "lift", "chair", "seats", "projector", "wall", "corridor", "hallway", "construction", "noise", "parking", "b204", "b-204"],
    "Hygiene": ["bathroom", "washroom", "toilet", "clean", "cleaning", "dirty", "smell", "trash", "dustbin", "bins", "canteen", "tables", "sticky", "hygiene", "unhygienic", "pest"],
    "Academics": ["marks", "internal", "data structures", "ds", "cse", "portal", "hall ticket", "admit card", "exam", "timetable", "conflict", "clash", "schedule", "fee", "attendance", "lecture", "lab"],
    "Sports Facilities": ["gym", "gymnasium", "treadmill", "basketball", "court", "equipment", "ground", "sports"],
    "Transport": ["bus", "route 4", "transport", "driver", "stops", "shuttle", "commute", "late bus"],
    "Safety": ["dog", "dogs", "stray", "guard", "gate", "harass", "threat", "theft", "unsafe", "dark night"],
    "Accessibility": ["ramp", "wheelchair", "disabled", "barrier", "braille", "accessibility"]
}

DEPARTMENT_MAP = {
    "Wi-Fi / Network": "IT Services",
    "Sports Facilities": "Sports Department",
    "Transport": "Transport Office",
    "Safety": "Security Office",
    "Hygiene": "Housekeeping",
    "Accessibility": "Maintenance"
}

def infer_category_and_department(text: str, current_cat: Optional[str] = None, current_dept: Optional[str] = None) -> Tuple[str, str]:
    """
    Infer or validate category and responsible department from complaint text.
    """
    text_lower = text.lower()
    
    # 1. Category inference if missing or generic
    category = current_cat
    if not category or category.strip() == "" or category == "General":
        scores = {}
        for cat, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text_lower))
            if score > 0:
                scores[cat] = score
        if scores:
            category = max(scores, key=scores.get)
        else:
            category = "Infrastructure"  # fallback
            
    # 2. Department inference
    department = current_dept
    if not department or department.strip() == "" or department == "General Administration":
        # Specific sub-routes for Academics:
        if category == "Academics":
            if any(k in text_lower for k in ["fee", "payment", "dues", "gateway"]):
                department = "Accounts Office"
            elif any(k in text_lower for k in ["hall ticket", "admit card", "examination", "exam"]):
                department = "Examination Cell"
            else:
                department = "Academic Office"
        elif category in DEPARTMENT_MAP:
            department = DEPARTMENT_MAP[category]
        else:
            department = "Maintenance"
            
    return category, department
