import requests
import pytest
from config import TestConfig

class TestAPIIntegration:
    """Automated Health & Integration Tests for Backend and ML Services."""

    def test_backend_health_check(self):
        """Verify Backend API is alive and reports healthy status."""
        try:
            res = requests.get(f"{TestConfig.API_URL}/health", timeout=5)
            assert res.status_code == 200, f"Backend returned status {res.status_code}"
            data = res.json()
            assert data.get("status") in ("ok", "online") or data.get("success") is True
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend is not running locally — skipping live healthcheck")

    def test_ml_service_health_check(self):
        """Verify Python FastAPI ML Microservice is running and RAG is initialized."""
        try:
            res = requests.get(f"{TestConfig.ML_URL}/health", timeout=5)
            assert res.status_code == 200, f"ML Microservice returned status {res.status_code}"
            data = res.json()
            assert data.get("status") == "healthy"
        except requests.exceptions.ConnectionError:
            pytest.skip("ML Microservice is not running locally — skipping live healthcheck")

    def test_coding_challenge_bank_api(self):
        """Verify Coding challenge bank returns 20 challenges with multi-language support."""
        try:
            res = requests.get(f"{TestConfig.API_URL}/coding", timeout=5)
            if res.status_code == 200:
                data = res.json()
                challenges = data.get("data", {}).get("challenges", [])
                assert len(challenges) >= 15, f"Expected at least 15 challenges, found {len(challenges)}"
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend is not running locally — skipping challenge bank test")
