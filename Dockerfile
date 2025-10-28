# Multi-stage build for Ekko Bot
# Stage 1: Build Go binaries (bot + API)
FROM golang:1.23-alpine AS go-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git make

# Copy Go modules files
COPY go.mod go.sum ./
RUN go mod download

# Copy Go source code
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY Makefile ./

# Build both binaries
RUN mkdir -p bin && \
    go build -o bin/bot-server -v ./cmd/bot && \
    go build -o bin/api-server -v ./cmd/api

# Stage 2: Build web UI
FROM node:20-alpine AS web-builder

WORKDIR /web

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY web/package.json web/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy web source code
COPY web/ ./

# Build web UI
RUN pnpm build

# Stage 3: Create minimal runtime image
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    ffmpeg \
    opus \
    python3 \
    py3-pip \
    curl \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN adduser -D -g '' botuser

# Copy Go binaries from builder
COPY --from=go-builder /app/bin/bot-server /app/bin/bot-server
COPY --from=go-builder /app/bin/api-server /app/bin/api-server

# Copy web build artifacts from builder
COPY --from=web-builder /web/dist /app/web/dist

# Set ownership
RUN chown -R botuser:botuser /app

USER botuser

# Expose ports
# 1337 - Web API (public-facing)
# 1338 - Bot Internal API (internal only)
# 1339 - Web UI (frontend)
EXPOSE 1337 1338 1339

# Environment variables with defaults
ENV BOT_INTERNAL_API_PORT=1338
ENV API_PORT=1337
ENV BOT_INTERNAL_API_URL=http://localhost:1338

# Start all services using a shell script
# For production, consider using a process manager like supervisord
CMD ["/bin/sh", "-c", "/app/bin/bot-server & /app/bin/api-server & wait"]