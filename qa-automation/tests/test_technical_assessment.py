import pytest
import time
from pages.technical_assessment_page import TechnicalAssessmentPage

class TestTechnicalAssessment:
    """End-to-End Automation Tests for Technical Assessment Module."""

    def test_assessment_launcher_loads(self, driver):
        """Verify Technical Assessment screen launches cleanly with role and level options."""
        page = TechnicalAssessmentPage(driver).open()
        assert page.is_launcher_displayed(), "Technical Assessment launcher screen failed to load"

    def test_start_internship_assessment_flow(self, driver):
        """Verify candidate can select Software Engineer / Intern and load coding workspace."""
        page = TechnicalAssessmentPage(driver).open()
        assert page.is_launcher_displayed()

        page.select_role_and_level(role="Software Engineer", level="Intern")
        page.start_assessment()

        assert page.is_editor_loaded(), "Coding workspace editor did not load after clicking Start Assessment"
