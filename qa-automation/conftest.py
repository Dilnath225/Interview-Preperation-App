import os
import pytest
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager

from config import TestConfig

@pytest.fixture(scope="session")
def browser_options():
    """Configure browser options for headless and CI/CD execution."""
    if TestConfig.BROWSER == "firefox":
        options = FirefoxOptions()
        if TestConfig.HEADLESS:
            options.add_argument("--headless")
        return options
    else:
        options = ChromeOptions()
        if TestConfig.HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,800")
        options.add_argument("--disable-notifications")
        options.add_argument("--remote-debugging-port=9222")
        return options

@pytest.fixture(scope="function")
def driver(browser_options):
    """Instantiate and tear down Selenium WebDriver per test."""
    if TestConfig.BROWSER == "firefox":
        service = FirefoxService(GeckoDriverManager().install())
        driver_instance = webdriver.Firefox(service=service, options=browser_options)
    else:
        try:
            service = ChromeService(ChromeDriverManager().install())
            driver_instance = webdriver.Chrome(service=service, options=browser_options)
        except Exception:
            # Fallback for CI/CD environments where chrome is already in PATH
            driver_instance = webdriver.Chrome(options=browser_options)

    driver_instance.implicitly_wait(TestConfig.DEFAULT_TIMEOUT)
    driver_instance.set_page_load_timeout(30)

    yield driver_instance

    driver_instance.quit()

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture screenshot on test failure and embed in report."""
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        driver = item.funcargs.get("driver")
        if driver:
            os.makedirs("reports/screenshots", exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_name = f"reports/screenshots/{item.name}_{timestamp}.png"
            driver.save_screenshot(file_name)
            print(f"\n[Selenium QA] Screenshot saved to: {file_name}")
