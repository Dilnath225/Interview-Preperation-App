FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

ENV PORT=8001
ENV HOST=0.0.0.0

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8001}/health || exit 1

# Start uvicorn dynamically binding to $PORT (Google Cloud Run overrides $PORT automatically)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}
