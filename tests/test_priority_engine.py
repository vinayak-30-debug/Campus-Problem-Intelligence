import unittest
from app.priority_engine import calculate_priority, SEVERITY_WEIGHTS, HAZARD_KEYWORDS


class TestPriorityBaseWeights(unittest.TestCase):
    """Test base severity weights calculation without surge or hazards."""

    def test_high_severity_single_report(self):
        score, level = calculate_priority(severity="High", report_count=1)
        assert score == 40.0
        assert level == "MEDIUM"  # 40.0 >= 28.0 and < 50.0

    def test_medium_severity_single_report(self):
        score, level = calculate_priority(severity="Medium", report_count=1)
        assert score == 25.0
        assert level == "LOW"  # 25.0 < 28.0

    def test_low_severity_single_report(self):
        score, level = calculate_priority(severity="Low", report_count=1)
        assert score == 12.0
        assert level == "LOW"

    def test_unknown_severity_falls_back_to_medium(self):
        score, level = calculate_priority(severity="Unspecified", report_count=1)
        assert score == 25.0
        assert level == "LOW"


class TestFrequencySurge(unittest.TestCase):
    """Test duplicate surge scaling: 15 * log2(count) capped at 45 pts."""

    def test_single_report_has_no_surge(self):
        score, _ = calculate_priority(severity="Medium", report_count=1)
        assert score == 25.0

    def test_zero_or_negative_report_count_has_no_surge(self):
        score, _ = calculate_priority(severity="Medium", report_count=0)
        assert score == 25.0
        score_neg, _ = calculate_priority(severity="Medium", report_count=-1)
        assert score_neg == 25.0

    def test_two_reports_surge(self):
        # 15 * log2(2) = 15.0 pts surge
        score, level = calculate_priority(severity="High", report_count=2)
        assert score == 40.0 + 15.0  # 55.0
        assert level == "HIGH"

    def test_four_reports_surge(self):
        # 15 * log2(4) = 30.0 pts surge
        score, level = calculate_priority(severity="High", report_count=4)
        assert score == 40.0 + 30.0  # 70.0
        assert level == "HIGH"

    def test_eight_reports_surge(self):
        # 15 * log2(8) = 45.0 pts surge (maximum surge cap reached)
        score, level = calculate_priority(severity="High", report_count=8)
        assert score == 40.0 + 45.0  # 85.0
        assert level == "CRITICAL"

    def test_surge_is_capped_at_45(self):
        # 16 reports would be 15 * 4 = 60, but must be capped at 45.0
        score_16, _ = calculate_priority(severity="Low", report_count=16)
        score_64, _ = calculate_priority(severity="Low", report_count=64)
        assert score_16 == 12.0 + 45.0  # 57.0
        assert score_64 == 12.0 + 45.0  # 57.0


class TestHazardKeywords(unittest.TestCase):
    """Test safety hazard keyword detection and score boost (+5 per keyword, up to +15)."""

    def test_single_hazard_keyword(self):
        # "fire" is in HAZARD_KEYWORDS -> +5 pts
        score, _ = calculate_priority(
            severity="Low",
            report_count=1,
            texts=["Small spark near switchboard, possible fire hazard"]
        )
        # "fire" and "hazard" both matched -> 2 * 5 = 10 pts
        assert score == 12.0 + 10.0

    def test_single_specific_hazard_keyword(self):
        # only "dark" matched
        score, _ = calculate_priority(
            severity="Medium",
            report_count=1,
            texts=["Pathway is very dark outside the hostel"]
        )
        assert score == 25.0 + 5.0  # 30.0

    def test_hazard_boost_capped_at_15(self):
        # "danger", "fall", "injury", "shock" -> 4 keywords, capped at 15.0 pts
        text = "Danger of fall and severe injury due to electrical shock hazard"
        score, _ = calculate_priority(
            severity="Medium",
            report_count=1,
            texts=[text]
        )
        assert score == 25.0 + 15.0  # 40.0

    def test_hazard_case_insensitivity(self):
        text = "SEVERE DANGER OF ELECTRIC SHOCK AND FIRE"
        score, _ = calculate_priority(
            severity="Medium",
            report_count=1,
            texts=[text]
        )
        assert score == 25.0 + 15.0

    def test_empty_or_none_texts(self):
        score_none, _ = calculate_priority(severity="High", report_count=1, texts=None)
        score_empty, _ = calculate_priority(severity="High", report_count=1, texts=[])
        assert score_none == 40.0
        assert score_empty == 40.0

    def test_benign_text_no_hazard_keywords(self):
        score, _ = calculate_priority(
            severity="Medium",
            report_count=1,
            texts=["Wi-Fi is slow in the library during morning study hours"]
        )
        assert score == 25.0


class TestPriorityTiersAndEscalation(unittest.TestCase):
    """Test discrete priority tier classification and multi-factor override rules."""

    def test_max_score_capped_at_100(self):
        # High base (40) + surge cap (45) + hazard cap (15) = 100.0
        score, level = calculate_priority(
            severity="High",
            report_count=20,
            texts=["fire", "shock", "danger", "hazard", "injury"]
        )
        assert score == 100.0
        assert level == "CRITICAL"

    def test_critical_score_threshold(self):
        # total_score >= 75.0 triggers CRITICAL
        # High (40) + surge for 6 reports (15 * log2(6) ≈ 38.8) = 78.8 -> CRITICAL
        score, level = calculate_priority(severity="High", report_count=6)
        assert score >= 75.0
        assert level == "CRITICAL"

    def test_critical_override_by_high_severity_and_report_count_5(self):
        # report_count >= 5 and severity in ["High", "Medium"] forces CRITICAL
        # Medium (25) + surge for 5 (15 * log2(5) ≈ 34.8) = 59.8 (< 75.0)
        score, level = calculate_priority(severity="Medium", report_count=5)
        assert score < 75.0
        assert level == "CRITICAL"  # Overridden by report_count >= 5 & Medium

    def test_high_override_by_report_count_3(self):
        # report_count >= 3 forces at least HIGH
        # Low (12) + surge for 3 (15 * log2(3) ≈ 23.8) = 35.8 (< 50.0)
        score, level = calculate_priority(severity="Low", report_count=3)
        assert score < 50.0
        assert level == "HIGH"  # Overridden by report_count >= 3

    def test_medium_threshold_boundary(self):
        # Score >= 28.0 classifies as MEDIUM
        # Medium (25) + 1 hazard keyword (5) = 30.0 -> MEDIUM
        score, level = calculate_priority(
            severity="Medium",
            report_count=1,
            texts=["unhygienic food counter"]
        )
        assert score == 30.0
        assert level == "MEDIUM"

    def test_low_threshold_boundary(self):
        # Score < 28.0 and report_count < 3 classifies as LOW
        score, level = calculate_priority(severity="Medium", report_count=1)
        assert score == 25.0
        assert level == "LOW"

    def test_hazard_keyword_escalation_preset_scenario(self):
        # Realistic preset: "fan in room B-204 wobbles and shakes dangerously"
        # base High (40) + hazard "shakes", "dangerously" -> "shake", "danger", "unsafe", etc.
        # "shake" and "danger" are in HAZARD_KEYWORDS -> +10 pts => 50.0 -> HIGH
        score, level = calculate_priority(
            severity="High",
            report_count=1,
            texts=["fan in room B-204 wobbles and shakes dangerously"]
        )
        assert score >= 50.0
        assert level == "HIGH"
