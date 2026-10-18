# Enterprise QA Automation Suite (Selenium + Pytest)

This directory contains the production-grade **End-to-End (E2E) Test Automation Suite** for the AI Mentor & Interview Preparation Platform, built with **Python**, **Selenium WebDriver**, and **Pytest** using the industry-standard **Page Object Model (POM)** architectural pattern.

---

## 🌟 Why Selenium WebDriver? (Industry Standard QA)

| Criteria | Selenium WebDriver | Cypress / Playwright |
| :--- | :--- | :--- |
| **Enterprise Standard** | Used by 90%+ top IT companies (WSO2, IFS, Sysco, Virtusa, London Stock Exchange) | Popular for JS frontends, but less widely standardized for dedicated QA teams |
| **Multi-Language Support** | Python, Java, C#, JS, Ruby (ideal for Python/QA test engineers) | Restricted to JS/TS or limited Python bindings |
| **Cross-Browser** | Native W3C WebDriver for Chrome, Firefox, Edge, Safari, Mobile Web | Partial engine emulations |
| **Non-JS Native Events** | Direct OS-level mouse and keyboard events | Synthetic JS events inside the DOM sandbox |

---

## 🏗️ Architecture: Page Object Model (POM)

```
qa-automation/
├── config.py                 # Centralized configuration (Headless mode, base URLs, timeouts)
├── conftest.py               # Pytest fixtures & automatic screenshot-on-failure hooks
├── pytest.ini                # Pytest CLI configuration & HTML report defaults
├── requirements.txt          # Python dependencies
├── run_qa_tests.py           # One-click CLI test runner with summary
├── pages/                    # Page Object Classes
│   ├── base_page.py          # Core Selenium helper methods & auto-login handler
│   ├── technical_assessment_page.py  # Technical assessment launcher & IDE page objects
│   ├── resume_review_page.py # ATS resume reviewer page objects
│   └── ai_chat_page.py       # AI mock interview chat page objects
├── tests/                    # E2E & Integration Test Specs
│   ├── test_backend_and_ml_api.py      # Microservices health & question bank API tests
│   ├── test_resume_ats.py              # ATS resume upload & internship rubric tests
│   └── test_technical_assessment.py    # HackerRank coding challenge launcher & flow tests
└── reports/                  # Generated test artifacts
    ├── qa_report.html        # Interactive HTML test execution report
    └── screenshots/          # Auto-saved PNG screenshots on test failures
```

---

## 🚀 Running the Tests Locally

### 1. Install Dependencies
Ensure you have Python 3.10+ installed:
```bash
pip install -r requirements.txt
```

### 2. Run the Full Test Suite with One Click
```bash
python run_qa_tests.py
```
This runs all 7 test cases headlessly, prints live status, and generates an interactive HTML report at `reports/qa_report.html`.

### 3. Run with Visible Browser (Headed Mode)
To see the browser open and click through the UI visually:
```bash
python -m pytest tests -v --headed
```

### 4. Run a Specific Test Module
```bash
python -m pytest tests/test_technical_assessment.py -v
```

---

## 🔄 CI/CD Integration

This QA Automation suite is wired into the **GitHub Actions CI Pipeline** (`.github/workflows/ci.yml`). On every push or pull request to `main`:
1. Services are spun up.
2. Selenium runs in headless Chrome on Ubuntu/Windows runners.
3. The interactive `qa_report.html` and any failure screenshots are uploaded as downloadable artifacts in GitHub Actions.
