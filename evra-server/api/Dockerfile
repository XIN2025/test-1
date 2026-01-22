FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

COPY pyproject.toml uv.lock ./


ENV UV_HTTP_TIMEOUT=600
ENV UV_HTTP_RETRY=3

RUN uv sync

COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
