FROM oven/bun:1.4.3-alpine@sha256:629e17411f1f129dbec3af78d5af9c9f2a937435c80349437206c6b0b7422373 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY vite.config.ts tsconfig.json ./
COPY src/ ./src/
COPY static/ ./static/
ARG PUBLIC_API_BASE_URL=https://dsas-cca.jamesflare.com/v1
ENV PUBLIC_API_BASE_URL=${PUBLIC_API_BASE_URL}
RUN bun run build

FROM nginx:1.30.6-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951 AS runner
LABEL org.opencontainers.image.source="https://github.com/JamesFlare1212/dsas-cca-frontend"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
