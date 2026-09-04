import os
import unittest
import numpy as np
from app.ai_engine import AIEngine, CANONICAL_TITLES


class TestAIEngineLightweightMode(unittest.TestCase):
    """Test AIEngine under USE_LIGHTWEIGHT_EMBEDDINGS=true environment setting."""

    def setUp(self):
        os.environ["USE_LIGHTWEIGHT_EMBEDDINGS"] = "true"
        self.engine = AIEngine()

    def tearDown(self):
        os.environ.pop("USE_LIGHTWEIGHT_EMBEDDINGS", None)

    def test_lightweight_mode_active(self):
        self.assertFalse(self.engine.is_transformer)
        self.assertIsNotNone(self.engine.tfidf)

    def test_encode_returns_valid_numpy_matrix(self):
        texts = [
            "Wi-Fi connection is dropping in the library",
            "Broken ceiling fan in classroom B-204"
        ]
        embs = self.engine.encode(texts)
        self.assertIsInstance(embs, np.ndarray)
        self.assertEqual(embs.shape[0], 2)
        self.assertGreater(embs.shape[1], 0)

    def test_cluster_reports_lightweight(self):
        texts = [
            "Central library wifi drops connection repeatedly",
            "Library internet wifi is unstable and disconnecting",
            "Classroom projector screen broken in room 101"
        ]
        categories = ["Wi-Fi / Network", "Wi-Fi / Network", "Infrastructure"]
        labels = self.engine.cluster_reports(texts=texts, categories=categories)
        self.assertEqual(len(labels), 3)
        # Wi-Fi reports should be grouped together
        self.assertEqual(labels[0], labels[1])

    def test_find_best_match_near_duplicate(self):
        existing_texts = [
            "Persistent wifi drops in central library",
            "Broken desk in hall A",
            "Canteen tables uncleaned and sticky"
        ]
        existing_cats = ["Wi-Fi / Network", "Infrastructure", "Hygiene"]
        existing_cids = [1, 2, 3]

        # Query clearly matching library wifi
        query = "library wifi connection dropping constantly"
        matched_cid, sim, idx, text = self.engine.find_best_match(
            query_text=query,
            query_category="Wi-Fi / Network",
            existing_texts=existing_texts,
            existing_categories=existing_cats,
            existing_cluster_ids=existing_cids
        )
        self.assertEqual(matched_cid, 1)
        self.assertGreater(sim, 0.15)
        self.assertEqual(idx, 0)

    def test_find_best_match_novel_issue(self):
        existing_texts = [
            "Persistent wifi drops in central library",
            "Broken desk in hall A"
        ]
        existing_cats = ["Wi-Fi / Network", "Infrastructure"]
        existing_cids = [1, 2]

        # Novel query unrelated to existing
        query = "Chemical spill and acid leak in chemistry laboratory room 405"
        matched_cid, sim, idx, text = self.engine.find_best_match(
            query_text=query,
            query_category="Safety",
            existing_texts=existing_texts,
            existing_categories=existing_cats,
            existing_cluster_ids=existing_cids
        )
        self.assertIsNone(matched_cid)


class TestClusterTitling(unittest.TestCase):
    """Test canonical and heuristic cluster titling."""

    def setUp(self):
        os.environ["USE_LIGHTWEIGHT_EMBEDDINGS"] = "true"
        self.engine = AIEngine()

    def tearDown(self):
        os.environ.pop("USE_LIGHTWEIGHT_EMBEDDINGS", None)

    def test_canonical_title_lookup(self):
        title = self.engine.generate_cluster_title(
            cluster_id=1,
            texts=["some text"],
            category="Wi-Fi / Network",
            location="Central Library",
            true_cluster_id=1
        )
        self.assertEqual(title, CANONICAL_TITLES[1])

    def test_extractive_heuristic_title_for_new_issue(self):
        title = self.engine.generate_cluster_title(
            cluster_id=999,
            texts=["Severe roof leakage dripping water on electrical switchboard"],
            category="Infrastructure",
            location="Room 302"
        )
        self.assertIn("Room 302", title)
        self.assertIn("Severe roof leakage", title)
