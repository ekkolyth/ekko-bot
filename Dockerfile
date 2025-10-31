# syntax=docker/dockerfile:1.7

###########################################
# Build Go Binaries
###########################################
FROM golang:1.23-bookworm AS go-builder
WORKDIR /src

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      build-essential \
      pkg-config \
      libopus-dev && \
    rm -rf /var/lib/apt/lists/*

ENV CGO_ENABLED=1
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build true

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY Makefile ./
RUN --mount=type=cache,target=/root/.cache/go-build make build

RUN mkdir -p /out && cp -r bin/* /out/

###########################################
# Build Web UI
###########################################
FROM node:22-bookworm AS web-builder
WORKDIR /web

RUN npm i -g pnpm@latest
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

COPY web/pnpm-lock.yaml web/package.json ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm build

###########################################
# Runtime (minimal, no build deps)
###########################################
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ffmpeg \
      libopus0 \
      opus-tools \
      curl \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

RUN useradd --create-home --shell /bin/bash appuser

COPY --from=go-builder /out/bot-server /app/bin/bot-server
COPY --from=go-builder /out/api-server /app/bin/api-server

COPY --from=web-builder /web/.output /app/web/.output

ENV API_PORT=1337
ENV WEB_PORT=3000
ENV NODE_ENV=production

RUN <<'SH'
set -eu
cat <<'EOF' > /app/start.sh
#!/usr/bin/env bash
set -euo pipefail

: "${DISCORD_BOT_TOKEN:?DISCORD_BOT_TOKEN is required}"
: "${DB_URL:?DB_URL is required}"
: "${BETTER_AUTH_URL:?BETTER_AUTH_URL is required}"
: "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}"

API_PORT="${API_PORT:-1337}"
WEB_PORT="${WEB_PORT:-3000}"

shutdown() {
  kill $(jobs -p) 2>/dev/null || true
  wait || true
  exit 0
}
trap shutdown SIGTERM SIGINT

/app/bin/bot-server &
/app/bin/api-server &

export PORT="3000"
export NITRO_PORT="3000"
export NITRO_HOST="0.0.0.0"
node /app/web/.output/server/index.mjs &

wait
EOF
chmod +x /app/start.sh
SH

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 1337 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${API_PORT}/healthz || exit 1

CMD ["/app/start.sh"]
