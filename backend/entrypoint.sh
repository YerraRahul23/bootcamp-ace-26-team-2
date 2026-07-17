#!/bin/sh
set -e

PORT=${PORT:-80}
export PORT

rm -f /etc/nginx/sites-enabled/default

envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info &
UVICORN_PID=$!

for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo "Backend ready"
        break
    fi
    sleep 1
done

exec nginx -g "daemon off;"
