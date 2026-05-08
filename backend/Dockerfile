FROM python:3.12-slim

# Set working directory to repo root inside the container
# so that `backend.app.*` imports resolve correctly
WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder as a package under /workspace/backend
COPY . ./backend

# Create media directory where uploaded files will be stored
RUN mkdir -p /workspace/backend/media

# Start the server — main.py handles schema sync on startup
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
