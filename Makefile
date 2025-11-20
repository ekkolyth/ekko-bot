# ==========================================================
# Environment Variables
# ==========================================================
BOT_BINARY_NAME=bot-server
API_BINARY_NAME=api-server
OUTPUT_DIR=bin

# Docker
IMAGE_NAME ?= ekkolyth/ekko-bot
IMAGE_TAG ?= dev

# Local Redis for dev
REDIS_CONTAINER_NAME ?= ekko-redis-dev
REDIS_IMAGE ?= redis:7-alpine

# Use Go
GOBUILD=go build
GO_SOURCE_HASH:=$(shell find . -name "*.go" | sort | xargs cat | sha1sum | cut -c1-8)

-include .env
export

ifndef REDIS_PORT
REDIS_PORT := 6379
endif
export REDIS_PORT

ifndef REDIS_URL
export REDIS_URL := redis://127.0.0.1:$(REDIS_PORT)/0
endif

# ==========================================================
# Top-level commands
# ==========================================================
all: build

build: build-bot build-api

build-bot:
	@mkdir -p $(OUTPUT_DIR)
	@$(GOBUILD) -ldflags "-X 'github.com/ekkolyth/ekko-bot/internal/shared/context/state.GoSourceHash=$(GO_SOURCE_HASH)'" \
		-o $(OUTPUT_DIR)/$(BOT_BINARY_NAME) -v ./cmd/bot

build-api:
	@mkdir -p $(OUTPUT_DIR)
	@$(GOBUILD) -o $(OUTPUT_DIR)/$(API_BINARY_NAME) -v ./cmd/api

clean:
	go clean
	rm -f $(OUTPUT_DIR)/$(BOT_BINARY_NAME)
	rm -f $(OUTPUT_DIR)/$(API_BINARY_NAME)

install:
	@if [ ! -d "web/node_modules" ]; then \
		echo "Installing web dependencies..."; \
		cd web && pnpm install; \
	fi

go: redis/up build
	@echo "Starting bot server, API server, and web UI..."
	@echo "Press Ctrl+C to stop all servers"
	@cleanup() { \
		kill %1 %2 %3 2>/dev/null || true; \
		$(MAKE) -s redis/down >/dev/null 2>&1 || true; \
		exit 0; \
	}; \
	trap cleanup INT; \
	./$(OUTPUT_DIR)/$(BOT_BINARY_NAME) & \
	./$(OUTPUT_DIR)/$(API_BINARY_NAME) & \
	cd web && pnpm dev & \
	wait; \
	cleanup

version:
	@echo "Version: $(GO_SOURCE_HASH)"

test:
	@echo "GOOSE_DBSTRING=$(GOOSE_DBSTRING)"

# ==========================================================
# Redis (namespaced)
# ==========================================================

redis/up:
	@if ! timeout 3 docker info >/dev/null 2>&1; then \
		echo "Error: Docker daemon is not responding. Please start Docker Desktop."; \
		exit 1; \
	fi; \
	RUNNING_CONTAINER=$$(timeout 3 docker ps -q -f name=$(REDIS_CONTAINER_NAME) 2>/dev/null || echo ""); \
	if [ -z "$$RUNNING_CONTAINER" ]; then \
		EXISTING_CONTAINER=$$(timeout 3 docker ps -aq -f name=$(REDIS_CONTAINER_NAME) 2>/dev/null || echo ""); \
		if [ -z "$$EXISTING_CONTAINER" ]; then \
			echo "Creating Redis container $(REDIS_CONTAINER_NAME) on port $(REDIS_PORT)..."; \
			if [ -n "$(REDIS_PASSWORD)" ]; then \
				docker run -d --name $(REDIS_CONTAINER_NAME) -p $(REDIS_PORT):6379 $(REDIS_IMAGE) \
					redis-server --save "" --appendonly no --requirepass $(REDIS_PASSWORD); \
			else \
				docker run -d --name $(REDIS_CONTAINER_NAME) -p $(REDIS_PORT):6379 $(REDIS_IMAGE) \
					redis-server --save "" --appendonly no; \
			fi \
		else \
			echo "Starting existing Redis container $(REDIS_CONTAINER_NAME)..."; \
			docker start $(REDIS_CONTAINER_NAME) >/dev/null; \
		fi \
	else \
		echo "Redis container $(REDIS_CONTAINER_NAME) already running."; \
	fi

redis/down:
	@if ! timeout 3 docker info >/dev/null 2>&1; then \
		echo "Error: Docker daemon is not responding."; \
		exit 1; \
	fi; \
	RUNNING_CONTAINER=$$(timeout 3 docker ps -q -f name=$(REDIS_CONTAINER_NAME) 2>/dev/null || echo ""); \
	if [ -n "$$RUNNING_CONTAINER" ]; then \
		echo "Stopping Redis container $(REDIS_CONTAINER_NAME)..."; \
		docker stop $(REDIS_CONTAINER_NAME) >/dev/null; \
	else \
		echo "Redis container $(REDIS_CONTAINER_NAME) is not running."; \
	fi

# ==========================================================
# Database (Goose)
# ==========================================================

MIGRATIONS_DIR=internal/db/migrations

db/up:
	@echo "Running database migrations..."
	goose -dir $(MIGRATIONS_DIR) up

db/down:
	@echo "Rolling back database migrations..."
	goose -dir $(MIGRATIONS_DIR) down

db/reset:
	@echo "Resetting Goose migrations..."
	goose -dir $(MIGRATIONS_DIR) reset

db/status:
	@echo "Checking migration status..."
	goose -dir $(MIGRATIONS_DIR) status

db/fix:
	@echo "Fixing Goose migration timestamps..."
	goose -dir $(MIGRATIONS_DIR) fix

db/fix.prod: env.db
	@read -p "Type 'fuckitlol' to fix Goose timestamps on production: " confirm; \
	[ "$$confirm" = "fuckitlol" ] || (echo "Aborted."; exit 1); \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) fix

# ==========================================================
# Verification
# ==========================================================

env.db:
	@test -n "$(DB_URL_PROD)" || (echo "DB_URL_PROD is not set. Export it or add it to .env"; exit 1)

env.auth:
	@test -n "$(BETTER_AUTH_DB_URL_PROD)" || (echo "BETTER_AUTH_DB_URL_PROD is not set. Export it or add it to web/.env"; exit 1)

# ==========================================================
# SQLC
# ==========================================================

db/generate:
	@echo "Generating SQLC code..."
	sqlc generate --file internal/db/sqlc.yaml

db/verify:
	@echo "Verifying SQLC queries..."
	sqlc compile --file internal/db/sqlc.yaml

# ==========================================================
# Production DB
# ==========================================================

db/up.prod: env.db
	@read -p "Type 'fuckitlol' to run Goose up on the production DB: " confirm; \
	[ "$$confirm" = "fuckitlol" ] || (echo "Aborted."; exit 1); \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) up

db/down.prod: env.db
	@read -p "Type 'fuckitlol' to roll back the production DB: " confirm; \
	[ "$$confirm" = "fuckitlol" ] || (echo "Aborted."; exit 1); \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) down

db/reset.prod: env.db
	@read -p "Type 'fuckitlol' to RESET ALL production migrations: " confirm; \
	[ "$$confirm" = "fuckitlol" ] || (echo "Aborted."; exit 1); \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) reset

db/status.prod: env.db
	@echo "Checking production Goose migration status..."
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) status



# ==========================================================
# Better Auth / Drizzle
# ==========================================================

auth/generate:
	cd web && npx @better-auth/cli generate --config src/lib/auth/auth.ts

drizzle/generate:
	cd web && npx drizzle-kit generate

drizzle/migrate:
	cd web && npx drizzle-kit migrate

drizzle/push:
	cd web && npx drizzle-kit push

drizzle/studio:
	cd web && npx drizzle-kit studio

# ==========================================================
# Drizzle (prod)
# ==========================================================

drizzle/migrate.prod: env.auth
	@read -p "Type 'fuckitlol' to run Drizzle migrate on production: " confirm; \
	[ "$$confirm" = "fuckitlol" ] || (echo "Aborted."; exit 1); \
	cd web && BETTER_AUTH_DB_URL=$(BETTER_AUTH_DB_URL_PROD) npx drizzle-kit migrate

drizzle/push.prod: env.auth
	@read -p "Type 'fuckitlol' to push Drizzle schema to production: " confirm; \
	[ "$$confirm" = "fuckitlol" ] || (echo "Aborted."; exit 1); \
	cd web && BETTER_AUTH_DB_URL=$(BETTER_AUTH_DB_URL_PROD) npx drizzle-kit push

# ==========================================================
# Docker
# ==========================================================

docker/build:
	docker build --platform linux/amd64 \
		--build-arg BETTER_AUTH_URL=$(BETTER_AUTH_URL) \
		-t $(IMAGE_NAME):$(IMAGE_TAG) .

docker/tag:
	@test -n "$(NEW_TAG)" || (echo "Usage: make docker/tag NEW_TAG=v0.1.0"; exit 1)
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):$(NEW_TAG)

docker/push:
	docker push ekkolyth/ekko-bot:dev

.PHONY: \
	all build build-bot build-api clean install go version test \
	redis/up redis/down \
	db/up db/down db/reset db/status db/fix db/up.prod db/down.prod db/reset.prod db/status.prod db/fix.prod \
	env.db env.auth \
	db/generate db/verify \
	auth/generate \
	drizzle/generate drizzle/migrate drizzle/push drizzle/studio \
	drizzle/migrate.prod drizzle/push.prod \
	docker/build docker/tag docker/push
