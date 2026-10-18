import os
from dotenv import load_dotenv

load_dotenv()

class TestConfig:
    # Target web client URL (default to local Expo web or production)
    BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8081")
    API_URL = os.getenv("TEST_API_URL", "http://localhost:5000/api")
    ML_URL = os.getenv("TEST_ML_URL", "http://localhost:8001")

    # Browser settings
    BROWSER = os.getenv("BROWSER", "chrome").lower()
    HEADLESS = os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes")
    DEFAULT_TIMEOUT = int(os.getenv("DEFAULT_TIMEOUT", "15"))

    # Test Credentials
    TEST_EMAIL = os.getenv("TEST_USER_EMAIL", "demo@aimentor.com")
    TEST_PASSWORD = os.getenv("TEST_USER_PASSWORD", "Password123!")
    TEST_NAME = "Dilnath Rathnayaka"
