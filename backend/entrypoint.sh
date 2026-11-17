#!/bin/sh
set -e

# The same image runs the web server (default CMD below), the Celery worker
# and Celery beat (compose overrides the command). Only the web server
# applies migrations and collects static files, so they never race.
if [ "$1" = "daphne" ]; then
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
fi

exec "$@"
