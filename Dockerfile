FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY vite.config.ts tsconfig.json ./
COPY src/ ./src/
COPY static/ ./static/
ARG PUBLIC_API_BASE_URL=https://dsas-cca.jamesflare.com/v1
ENV PUBLIC_API_BASE_URL=${PUBLIC_API_BASE_URL}
RUN bun run build

FROM caddy:2.11.9-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0 AS runner
LABEL org.opencontainers.image.source="https://github.com/JamesFlare1212/dsas-cca-frontend"
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist/ /srv/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1/healthz || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
