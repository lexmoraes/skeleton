FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/media /app/staticfiles

RUN adduser --disabled-password --no-create-home --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# TCP probe on purpose: an HTTP request would carry Host: 127.0.0.1, which
# Django rejects (400) unless it's in DJANGO_ALLOWED_HOSTS. Daphne only starts
# listening after entrypoint.sh has applied the migrations.
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD python -c "import socket; socket.create_connection(('127.0.0.1', 8000), timeout=3).close()"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["daphne", "--bind", "0.0.0.0", "--port", "8000", "config.asgi:application"]
