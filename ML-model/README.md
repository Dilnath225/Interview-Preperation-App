# 🐍 AI Mentor - Python ML & AI Microservice

FastAPI microservice providing Gemini LLM integration, speech/interview evaluation, and Resume ATS keyword diagnostics.

---

## 🛠️ Setup & Running

```bash
cd ML-model

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Configure Gemini API Key in .env
# GEMINI_API_KEY=your_key_here

# Run development server
python main.py
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
