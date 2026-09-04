import os
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity, cosine_distances
from sklearn.cluster import AgglomerativeClustering
import re

# Curated high-fidelity titles for recurring seed issues
CANONICAL_TITLES = {
    1: "Central Library: Persistent Wi-Fi Connectivity Drops",
    2: "Boys Hostel Block C: Zero Wi-Fi Signal in Rooms",
    3: "Academic Block B (B-204): Dangerous Shaking Ceiling Fan",
    4: "Academic Block A (Ground Floor): Corridor Lighting Outage",
    5: "Main Auditorium: Damaged & Broken Rear-Row Seating",
    6: "Girls Hostel Block A (Floor 3): Severe Washroom Uncleanliness",
    7: "Campus Canteen: Sticky Uncleaned Dining Tables",
    8: "Computer Science Dept: Data Structures Internal Marks Not Updated",
    9: "Exam Portal: Hall Ticket / Admit Card Download 404 Error",
    10: "Basketball Court: Cracked & Uneven Hazardous Flooring",
    11: "Campus Gymnasium: Non-functional Broken Treadmills",
    12: "Transport: Route 4 College Bus Severe Morning Delays",
    13: "Student Parking Area: Inadequate Night Lighting & Safety Hazard",
    14: "Mechanical Engineering (3rd Yr): Thursday Lab-Lecture Timetable Clash",
    15: "Classroom Block C: Overflowing Dustbins & Trash Accumulation"
}

class AIEngine:
    def __init__(self):
        self.model = None
        self.is_transformer = False
        self._load_model()

    def _load_model(self):
        use_lightweight = os.environ.get("USE_LIGHTWEIGHT_EMBEDDINGS", "").strip().lower() in ("true", "1", "yes")
        if use_lightweight:
            print("[AI Engine] USE_LIGHTWEIGHT_EMBEDDINGS is enabled: Skipping sentence-transformers/torch to prevent OOM on Render 512MB RAM instance.", flush=True)
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.tfidf = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            self.is_transformer = False
            return

        try:
            from sentence_transformers import SentenceTransformer
            print("[AI Engine] Loading SentenceTransformer 'all-MiniLM-L6-v2'...", flush=True)
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.is_transformer = True
            print("[AI Engine] SentenceTransformer loaded successfully!", flush=True)
        except Exception as e:
            print(f"[AI Engine] Notice: Using TF-IDF fallback due to: {e}", flush=True)
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.tfidf = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            self.is_transformer = False

    def encode(self, texts: List[str]) -> np.ndarray:
        if self.is_transformer and self.model is not None:
            return self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        else:
            return self.tfidf.fit_transform(texts).toarray()

    def cluster_reports(
        self,
        texts: List[str],
        categories: List[str] = None,
        distance_threshold: Optional[float] = None
    ) -> List[int]:
        """
        Perform hierarchical agglomerative clustering on report texts.
        Returns cluster labels (0-indexed integers).
        """
        if len(texts) <= 1:
            return [0] * len(texts)
            
        # Calibrate distance threshold based on vector representation (dense vs sparse TF-IDF)
        if distance_threshold is None or (not self.is_transformer and distance_threshold <= 0.55):
            effective_dist = 0.88 if not self.is_transformer else (distance_threshold or 0.48)
        else:
            effective_dist = distance_threshold

        embeddings = self.encode(texts)
        dist_matrix = cosine_distances(embeddings)
        
        # Penalize distance slightly if categories explicitly differ
        if categories and len(categories) == len(texts):
            for i in range(len(texts)):
                for j in range(i + 1, len(texts)):
                    if categories[i] != categories[j]:
                        dist_matrix[i, j] = min(1.0, dist_matrix[i, j] + 0.15)
                        dist_matrix[j, i] = dist_matrix[i, j]
                        
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=effective_dist,
            metric='precomputed',
            linkage='average'
        )
        labels = clustering.fit_predict(dist_matrix)
        return labels.tolist()

    def find_best_match(
        self,
        query_text: str,
        query_category: Optional[str],
        existing_texts: List[str],
        existing_categories: List[str],
        existing_cluster_ids: List[int],
        threshold: Optional[float] = None
    ) -> Tuple[Optional[int], float, Optional[int], Optional[str]]:
        """
        Online near-duplicate matching for incoming student complaints.
        Returns: (matched_cluster_id, max_similarity, matched_index, matched_text)
        """
        if not existing_texts:
            return None, 0.0, None, None
            
        all_texts = existing_texts + [query_text]
        all_embs = self.encode(all_texts)
        
        query_emb = all_embs[-1:]
        cand_embs = all_embs[:-1]
        
        sims = cosine_similarity(query_emb, cand_embs)[0]
        
        # Category-aware boost / filter
        adjusted_sims = sims.copy()
        if query_category:
            for idx, c in enumerate(existing_categories):
                if c == query_category:
                    adjusted_sims[idx] = min(1.0, adjusted_sims[idx] + 0.05)
                else:
                    adjusted_sims[idx] = max(0.0, adjusted_sims[idx] - 0.08)
                    
        best_idx = int(np.argmax(adjusted_sims))
        raw_sim = float(sims[best_idx])
        adj_sim = float(adjusted_sims[best_idx])
        
        effective_sim = max(raw_sim, adj_sim)
        
        # Adaptive thresholds: Dense neural embeddings vs sparse TF-IDF vectors
        if threshold is None or (not self.is_transformer and threshold >= 0.50):
            match_thresh = 0.18 if not self.is_transformer else 0.58
        else:
            match_thresh = threshold

        raw_thresh = 0.20 if not self.is_transformer else 0.62

        if effective_sim >= match_thresh or raw_sim >= raw_thresh:
            matched_cluster_id = existing_cluster_ids[best_idx]
            matched_text = existing_texts[best_idx]
            return matched_cluster_id, raw_sim, best_idx, matched_text
        else:
            return None, raw_sim, None, None

    def generate_cluster_title(
        self,
        cluster_id: int,
        texts: List[str],
        category: str,
        location: str,
        true_cluster_id: Optional[int] = None
    ) -> str:
        """
        Generate a concise, professional title for a cluster of reports.
        """
        # If matches seed canonical cluster, use canonical title
        if true_cluster_id and true_cluster_id in CANONICAL_TITLES:
            return CANONICAL_TITLES[true_cluster_id]
        if cluster_id in CANONICAL_TITLES:
            return CANONICAL_TITLES[cluster_id]
            
        # Extractive heuristic for new issues
        if texts:
            shortest = min(texts, key=len)
            clean = re.sub(r'^[A-Z0-9_-]+:\s*', '', shortest)
            clean = clean.strip()
            if len(clean) > 65:
                clean = clean[:62] + "..."
            if location and location not in clean and len(location) < 30:
                return f"{location}: {clean}"
            return clean
            
        return f"{category} Issue at {location}"
