# ==============================================================================
# Root Dockerfile for Render Deployments
# Builds QuantaFleet (SIH26137) from repository root
# ==============================================================================

# Stage 1: Build the Vite frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY Quantafleet/frontend/package*.json ./
RUN npm install
COPY Quantafleet/frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend and serve everything
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY Quantafleet/backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip "setuptools<66.0.0" wheel
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY Quantafleet/backend/ ./backend/
# Copy the built frontend static files so FastAPI can serve them
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000

# Run the FastAPI server with dynamic Render PORT support
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
