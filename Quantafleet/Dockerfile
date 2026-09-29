# Stage 1: Build the Vite frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend and serve everything
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if any are needed for numpy/scipy/networkx (often required by dwave/scipy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip "setuptools<66.0.0" wheel
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
# Copy the built frontend static files so FastAPI can serve them
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the port
EXPOSE 8000

# Run the FastAPI server
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
