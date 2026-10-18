from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class AIChatPage(BasePage):
    """Page Object for AI Mentor Chat Screen."""

    PATH = "/ai-chat"

    # Locators
    CHAT_HEADER = (By.XPATH, "//*[contains(text(), 'AI Mentor') or contains(text(), 'Career Coach')]")
    MESSAGE_INPUT = (By.XPATH, "//input[@type='text'] | //textarea")
    SEND_BUTTON = (By.XPATH, "//button | //*[@role='button']")

    def open(self):
        self.navigate_to(self.PATH)
        return self

    def is_loaded(self):
        return self.is_visible(self.CHAT_HEADER, timeout=10)
