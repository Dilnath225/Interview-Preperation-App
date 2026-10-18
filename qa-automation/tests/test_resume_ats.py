import pytest
from pages.resume_review_page import ResumeReviewPage

class TestResumeReviewATS:
    """End-to-End Automation Tests for Resume ATS Review Module."""

    def test_resume_review_screen_loads(self, driver):
        """Verify Resume Review screen loads properly with target evaluation rubric."""
        page = ResumeReviewPage(driver).open()
        assert page.is_loaded(), "Resume Review screen failed to load"

    def test_intern_role_chip_available_in_rubric(self, driver):
        """Verify that 'Software Engineer Intern' is available as a first-class target role option."""
        page = ResumeReviewPage(driver).open()
        assert page.is_loaded()

        page.toggle_rubric()
        assert page.is_intern_chip_present(), "Software Engineer Intern chip not found in rubric"
