#!/bin/sh
# Exercise the actual production Caddy image without access to the public API.
set -eu

image=${1:-dsas-cca-frontend:ci}
docker run --rm --interactive --network none --entrypoint /bin/sh "$image" -eu <<'CONTAINER'
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile > /tmp/caddy.log 2>&1 &
server_pid=$!
trap 'result=$?; if [ "$result" -ne 0 ]; then cat /tmp/headers /tmp/caddy.log 2>/dev/null || true; fi; kill "$server_pid" 2>/dev/null || true; exit "$result"' EXIT

ready=false
for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if wget -q -O /dev/null http://127.0.0.1/healthz; then
        ready=true
        break
    fi
    sleep 1
done
if [ "$ready" != true ]; then
    cat /tmp/caddy.log >&2
    exit 1
fi

for route in / /staff/ /saved/; do
    wget -q -O /tmp/page "http://127.0.0.1$route"
    cmp /tmp/page "/srv${route}index.html"
done

wget -q -O /tmp/health http://127.0.0.1/healthz
test "$(cat /tmp/health)" = ok

for route in /missing-page/ /404.html /_app/immutable/missing.js; do
    if wget -S -O /dev/null "http://127.0.0.1$route" > /tmp/headers 2>&1; then
        echo "Unknown/error paths must return HTTP 404: $route" >&2
        exit 1
    fi
    grep -q 'HTTP/1.1 404' /tmp/headers
done

for route in /staff /saved; do
    wget -q -O /tmp/page "http://127.0.0.1$route"
    cmp /tmp/page "/srv${route}/index.html"
done

wget -S -O /dev/null http://127.0.0.1/ > /tmp/headers 2>&1
grep -q 'Cache-Control: no-cache' /tmp/headers

asset=$(find /srv/_app/immutable -name '*.js' | head -n 1)
test -n "$asset"
asset_path=${asset#/srv}
wget -S -O /tmp/asset "http://127.0.0.1$asset_path" > /tmp/headers 2>&1
cmp "$asset" /tmp/asset
grep -q 'Cache-Control: public, max-age=31536000, immutable' /tmp/headers

wget -S --header 'Accept-Encoding: gzip' -O /tmp/compressed \
    http://127.0.0.1/staff/ > /tmp/headers 2>&1
grep -q 'Content-Encoding: gzip' /tmp/headers
gzip -dc /tmp/compressed > /tmp/page
cmp /tmp/page /srv/staff/index.html

echo 'Production container smoke tests passed.'
CONTAINER
