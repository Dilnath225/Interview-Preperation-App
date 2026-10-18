from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class TechnicalAssessmentPage(BasePage):
    """Page Object for Technical Assessment / Coding Workspace screen."""

    PATH = "/coding-challenge"

    # Locators
    HERO_TITLE = (By.XPATH, "//*[contains(., 'Tailored Coding Assessment') or contains(., 'Technical Assessment')]")
    SOFTWARE_ENGINEER_ROLE = (By.XPATH, "//*[contains(., 'Software Engineer')]")
    DEVOPS_ROLE = (By.XPATH, "//*[contains(., 'DevOps & Cloud')]")
    QA_ROLE = (By.XPATH, "//*[contains(., 'QA & Automation')]")
    
    INTERN_LEVEL = (By.XPATH, "//*[contains(., 'Intern / Trainee')]")
    JUNIOR_LEVEL = (By.XPATH, "//*[contains(., 'Junior / Associate')]")
    SENIOR_LEVEL = (By.XPATH, "//*[contains(., 'Mid-Senior / Lead')]")

    START_ASSESSMENT_BTN = (By.XPATH, "//*[@role='button'][contains(., 'Start') and contains(., 'Assessment')] | //*[contains(., 'Start') and contains(., 'Assessment') and not(descendant::*[contains(., 'Start') and contains(., 'Assessment')])]")
    RUN_CODE_BTN = (By.XPATH, "//*[contains(., 'Run Code')]")
    RUN_ALL_TESTS_BTN = (By.XPATH, "//*[contains(., 'Run All Tests')]")
    SUBMIT_ASSESSMENT_BTN = (By.XPATH, "//*[contains(., 'Submit Assessment') or contains(., 'Finish & Submit')]")

    def open(self):
        self.navigate_to(self.PATH)
        self.login_if_needed()
        if not self.is_launcher_displayed():
            self.navigate_to(self.PATH)
        return self

    def is_launcher_displayed(self):
        return self.is_visible(self.HERO_TITLE, timeout=12)

    def select_role_and_level(self, role="Software Engineer", level="Intern"):
        if role == "DevOps":
            self.click(self.DEVOPS_ROLE)
        elif role == "QA":
            self.click(self.QA_ROLE)
        else:
            self.click(self.SOFTWARE_ENGINEER_ROLE)

        if level == "Intern":
            self.click(self.INTERN_LEVEL)
        elif level == "Senior":
            self.click(self.SENIOR_LEVEL)
        else:
            self.click(self.JUNIOR_LEVEL)

    def start_assessment(self):
        import time
        self.driver.execute_script("window.scrollTo(0, 500);")
        time.sleep(0.5)
        btn = self.find(self.START_ASSESSMENT_BTN)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
        time.sleep(0.5)
        try:
            btn.click()
        except Exception:
            self.driver.execute_script("arguments[0].click();", btn)

    def is_editor_loaded(self):
        return self.is_visible(self.RUN_CODE_BTN, timeout=12)

    def click_run_code(self):
        self.click(self.RUN_CODE_BTN)
