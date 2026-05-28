FROM python:3.12-slim

WORKDIR /app

# System deps + Chromium dependencies manually
RUN apt-get update && apt-get install -y \
    gcc g++ libffi-dev libssl-dev curl \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2 \
    fonts-unifont fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browser only (no install-deps)
RUN python -m playwright install chromium

# Copy source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]