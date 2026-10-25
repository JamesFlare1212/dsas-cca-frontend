#!/bin/sh
# Exercise the actual production Nginx image without access to the public API.
set -eu

image=${1:-dsas-cca-frontend:ci}
docker run --rm --interactive --network none --entrypoint /bin/sh "$image" -eu <<'CONTAINER'
nginx -t
nginx
trap 'nginx -s quit' EXIT

for route in / /staff/ /saved/; do
    wget -q -O /tmp/page "http://127.0.0.1$route"
    cmp /tmp/page "/usr/share/nginx/html${route}index.html"
done

wget -q -O /tmp/health http://127.0.0.1/healthz
test "$(cat /tmp/health)" = ok

if wget -S -O /dev/null http://127.0.0.1/missing-page/ > /tmp/headers 2>&1; then
    echo 'Unknown paths must return HTTP 404' >&2
    exit 1
fi
grep -q 'HTTP/1.1 404' /tmp/headers

wget -S -O /dev/null http://127.0.0.1/ > /tmp/headers 2>&1
grep -q 'Cache-Control: no-cache' /tmp/headers

asset=$(find /usr/share/nginx/html/_app/immutable -name '*.js' | head -n 1)
test -n "$asset"
asset_path=${asset#/usr/share/nginx/html}
wget -S -O /tmp/asset "http://127.0.0.1$asset_path" > /tmp/headers 2>&1
cmp "$asset" /tmp/asset
grep -q 'Cache-Control: public, max-age=31536000, immutable' /tmp/headers

wget -S --header 'Accept-Encoding: gzip' -O /tmp/compressed \
    http://127.0.0.1/staff/ > /tmp/headers 2>&1
grep -q 'Content-Encoding: gzip' /tmp/headers
gzip -dc /tmp/compressed > /tmp/page
cmp /tmp/page /usr/share/nginx/html/staff/index.html

echo 'Production container smoke tests passed.'
CONTAINER
