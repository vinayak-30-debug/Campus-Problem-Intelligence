import unittest
from app.router_engine import infer_category_and_department, CATEGORY_KEYWORDS, DEPARTMENT_MAP


class TestCategoryInference(unittest.TestCase):
    """Test category inference from complaint text keywords."""

    def test_wifi_network_category_inferred(self):
        text = "Hostel 3 wi-fi signal is very weak and internet connection keeps disconnecting"
        cat, dept = infer_category_and_department(text)
        assert cat == "Wi-Fi / Network"
        assert dept == "IT Services"

    def test_infrastructure_category_inferred(self):
        text = "The ceiling fan in lecture hall B-204 is making strange noise and light is flickering"
        cat, dept = infer_category_and_department(text)
        assert cat == "Infrastructure"
        assert dept == "Maintenance"

    def test_hygiene_category_inferred(self):
        text = "Canteen tables are sticky with dirty food leftovers and trash bins are overflowing"
        cat, dept = infer_category_and_department(text)
        assert cat == "Hygiene"
        assert dept == "Housekeeping"

    def test_sports_facilities_category_inferred(self):
        text = "Gymnasium treadmill belt is torn and basketball court floor is damaged"
        cat, dept = infer_category_and_department(text)
        assert cat == "Sports Facilities"
        assert dept == "Sports Department"

    def test_transport_category_inferred(self):
        text = "College bus on route 4 was 45 minutes late and driver skipped the designated stops"
        cat, dept = infer_category_and_department(text)
        assert cat == "Transport"
        assert dept == "Transport Office"

    def test_safety_category_inferred(self):
        text = "Aggressive stray dogs near campus gate 2 are barking at pedestrians in dark night"
        cat, dept = infer_category_and_department(text)
        assert cat == "Safety"
        assert dept == "Security Office"

    def test_accessibility_category_inferred(self):
        text = "Wheelchair ramp at library entrance is blocked by construction barrier"
        cat, dept = infer_category_and_department(text)
        assert cat == "Accessibility"
        assert dept == "Maintenance"

    def test_fallback_to_infrastructure_when_no_keywords_match(self):
        text = "Lorem ipsum dolor sit amet completely unidentifiable complaint text"
        cat, dept = infer_category_and_department(text)
        assert cat == "Infrastructure"
        assert dept == "Maintenance"

    def test_highest_keyword_count_wins(self):
        # 3 Wi-Fi keywords ('wifi', 'internet', 'router') vs 1 Infrastructure keyword ('water')
        text = "Need water near the router because wifi and internet are not reachable"
        cat, _ = infer_category_and_department(text)
        assert cat == "Wi-Fi / Network"


class TestDepartmentRouting(unittest.TestCase):
    """Test department assignment rules including academic sub-routings."""

    def test_academics_accounts_office_subroute(self):
        text = "Semester fee payment failed on the portal but money was deducted, pending dues"
        cat, dept = infer_category_and_department(text)
        assert cat == "Academics"
        assert dept == "Accounts Office"

    def test_academics_examination_cell_subroute(self):
        text = "Unable to download hall ticket and admit card for final examination semester exams"
        cat, dept = infer_category_and_department(text)
        assert cat == "Academics"
        assert dept == "Examination Cell"

    def test_academics_general_academic_office_subroute(self):
        text = "Internal marks for data structures cse course are missing on portal"
        cat, dept = infer_category_and_department(text)
        assert cat == "Academics"
        assert dept == "Academic Office"

    def test_all_department_map_mappings(self):
        # Ensure DEPARTMENT_MAP covers all expected categories
        expected_mappings = {
            "Wi-Fi / Network": "IT Services",
            "Sports Facilities": "Sports Department",
            "Transport": "Transport Office",
            "Safety": "Security Office",
            "Hygiene": "Housekeeping",
            "Accessibility": "Maintenance"
        }
        for cat, dept in expected_mappings.items():
            assert DEPARTMENT_MAP[cat] == dept


class TestExistingCategoryAndDepartmentPreservation(unittest.TestCase):
    """Test that existing valid user selections are preserved."""

    def test_preserves_explicit_category(self):
        text = "Random issue description"
        cat, dept = infer_category_and_department(
            text=text,
            current_cat="Sports Facilities",
            current_dept=None
        )
        assert cat == "Sports Facilities"
        assert dept == "Sports Department"

    def test_preserves_explicit_department(self):
        text = "Wi-Fi disconnected in the hostel"
        cat, dept = infer_category_and_department(
            text=text,
            current_cat=None,
            current_dept="Special IT Taskforce"
        )
        assert cat == "Wi-Fi / Network"
        assert dept == "Special IT Taskforce"

    def test_general_category_is_overwritten_by_inference(self):
        text = "The washroom toilet is dirty and smells bad"
        cat, dept = infer_category_and_department(
            text=text,
            current_cat="General",
            current_dept=None
        )
        assert cat == "Hygiene"
        assert dept == "Housekeeping"

    def test_general_administration_dept_is_overwritten_by_inference(self):
        text = "Bus route 4 did not stop at main campus"
        cat, dept = infer_category_and_department(
            text=text,
            current_cat="Transport",
            current_dept="General Administration"
        )
        assert cat == "Transport"
        assert dept == "Transport Office"

    def test_whitespace_only_category_and_dept_trigger_inference(self):
        text = "Gym basketball court needs repair"
        cat, dept = infer_category_and_department(
            text=text,
            current_cat="   ",
            current_dept="   "
        )
        assert cat == "Sports Facilities"
        assert dept == "Sports Department"


class TestWordBoundaryMatching(unittest.TestCase):
    """Test regex word boundaries prevent false positive partial matches."""

    def test_word_boundaries_prevent_partial_matches(self):
        # 'rampart' should not match 'ramp' (Accessibility)
        # 'canteen' should not match 'can'
        # 'buffet' should not match 'bus'
        text = "The rampart on ancient history exam lecture slides"
        cat, dept = infer_category_and_department(text)
        # Should match Academics ('exam', 'lecture') rather than Accessibility ('ramp')
        assert cat == "Academics"
