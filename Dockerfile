# Multi-stage Dockerfile for Ekko Bot
# Stage 1: Build Go binaries (bot + API)
FROM golang:1.21-alpine AS go-builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy Go source files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY Makefile ./

# Build bot binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bot ./cmd/bot

# Build API binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api ./cmd/api

# Stage 2: Build web UI
FROM node:18-alpine AS web-builder

WORKDIR /app/web

# Copy web package files
COPY web/package.json web/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy web source code
COPY web/ ./

# Build web UI
RUN pnpm build

# Stage 3: Create minimal runtime image
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    libopus \
    libopus-dev \
    libopusenc \
    libopusfile-dev \
    opus-tools \
    ca-certificates \
    tzdata

# Install yt-dlp
RUN apk add --no-cache curl && \
    curl -L --fail https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apk del curl

# Create non-root user
RUN adduser -D -s /bin/sh botuser

WORKDIR /app

# Copy compiled Go binaries from Stage 1
COPY --from=go-builder /app/bot /app/bot
COPY --from=go-builder /app/api /app/api

# Copy web build artifacts from Stage 2
COPY --from=web-builder /app/dist /app/web/dist
COPY --from=web-builder /app/public /app/web/public

# Copy any additional files needed
COPY --from=go-builder /app/internal/db/migrations /app/internal/db/migrations

# Set ownership
RUN chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Expose ports
EXPOSE 1337 1338 1339

# Set environment variables
ENV API_PORT=1337
ENV BOT_API_PORT=1338
ENV DISCORD_GUILD_ID=""
ENV DISCORD_BOT_TOKEN=""
ENV BOT_INTERNAL_API_URL=http://localhost:1338
ENV DATABASE_URL=""
ENV CORS_ALLOWED_ORIGINS=http://localhost:1339,http://localhost:3000

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Ekko Bot..."' >> /app/start.sh && \
    echo 'echo "Starting Bot (Discord + Internal API)..."' >> /app/start.sh && \
    echo './bot &' >> /app/start.sh && \
    echo 'BOT_PID=$!' >> /app/start.sh && \
    echo 'echo "Starting Web API..."' >> /app/start.sh && \
    echo './api &' >> /app/start.sh && \
    echo 'API_PID=$!' >> /app/start.sh && \
    echo 'echo "Starting Web UI..."' >> /app/start.sh && \
    echo 'cd web && python3 -m http.server 1339 &' >> /app/start.sh && \
    echo 'WEB_PID=$!' >> /app/start.sh && \
    echo 'echo "All services started!"' >> /app/start.sh && \
    echo 'echo "Bot Internal API: http://localhost:1338"' >> /app/start.sh && \
    echo 'echo "Web API: http://localhost:1337"' >> /app/start.sh && \
    echo 'echo "Web UI: http://localhost:1339"' >> /app/start.sh && \
    echo 'echo "Press CTRL-C to stop all services"' >> /app/start.sh && \
    echo 'wait $BOT_PID $API_PID $WEB_PID' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start all services
CMD ["/app/start.sh"]