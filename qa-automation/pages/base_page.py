from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from config import TestConfig

class BasePage:
    """Base Page Object class containing common browser actions."""

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, TestConfig.DEFAULT_TIMEOUT)

    def navigate_to(self, path=""):
        url = f"{TestConfig.BASE_URL}{path}"
        self.driver.get(url)

    def find(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def click(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()

    def type_text(self, locator, text):
        element = self.find_visible(locator)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator):
        element = self.find_visible(locator)
        return element.text

    def is_visible(self, locator, timeout=5):
        try:
            WebDriverWait(self.driver, timeout).until(EC.visibility_of_element_located(locator))
            return True
        except Exception:
            return False

    def get_page_title(self):
        return self.driver.title

    def get_current_url(self):
        return self.driver.current_url

    def login_if_needed(self):
        """Automatically fills demo credentials and signs in if on login screen."""
        import time
        demo_btn = (By.XPATH, "//*[contains(text(), 'Fill Demo Credentials')]")
        sign_in_btn = (By.XPATH, "//*[contains(text(), 'Sign In')]")
        if self.is_visible(demo_btn, timeout=4):
            self.click(demo_btn)
            time.sleep(0.5)
            self.click(sign_in_btn)
            time.sleep(2)
