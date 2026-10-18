from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class ResumeReviewPage(BasePage):
    """Page Object for Resume Review ATS Screen."""

    PATH = "/resume-review"

    # Locators
    TITLE = (By.XPATH, "//*[contains(text(), 'Resume') or contains(text(), 'ATS')]")
    RUBRIC_TOGGLE = (By.XPATH, "//*[contains(text(), 'Target Evaluation Rubric')]")
    UPLOAD_BTN = (By.XPATH, "//*[contains(text(), 'Upload') or contains(text(), 'Select Resume')]")
    INTERN_CHIP = (By.XPATH, "//*[contains(text(), 'Software Engineer Intern')]")

    def open(self):
        self.navigate_to(self.PATH)
        return self

    def is_loaded(self):
        return self.is_visible(self.TITLE, timeout=10)

    def toggle_rubric(self):
        self.click(self.RUBRIC_TOGGLE)

    def is_intern_chip_present(self):
        return self.is_visible(self.INTERN_CHIP, timeout=5)
