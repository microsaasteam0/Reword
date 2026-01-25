FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies including network diagnostic tools
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    wget \
    curl \
    netcat-openbsd \
    iputils-ping \
    dnsutils \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY . /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 80

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]