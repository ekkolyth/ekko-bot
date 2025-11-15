# Environment Variables
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

all: build

build: build-bot build-api

build-bot:
	mkdir -p $(OUTPUT_DIR)
	$(GOBUILD) -ldflags "-X 'github.com/ekkolyth/ekko-bot/internal/shared/context/state.GoSourceHash=$(GO_SOURCE_HASH)'" -o $(OUTPUT_DIR)/$(BOT_BINARY_NAME) -v ./cmd/bot

build-api:
	mkdir -p $(OUTPUT_DIR)
	$(GOBUILD) -o $(OUTPUT_DIR)/$(API_BINARY_NAME) -v ./cmd/api

clean:
	go clean
	rm -f $(OUTPUT_DIR)/$(BOT_BINARY_NAME)
	rm -f $(OUTPUT_DIR)/$(API_BINARY_NAME)

install:
	@if [ ! -d "web/node_modules" ]; then \
		echo "Installing web dependencies..."; \
		cd web && pnpm install; \
	fi

go: redis/start build
	@echo "Starting bot server, API server, and web UI..."
	@echo "Press Ctrl+C to stop all servers"
	@cleanup() { \
		kill %1 %2 %3 2>/dev/null || true; \
		$(MAKE) -s redis/stop >/dev/null 2>&1 || true; \
		exit 0; \
	}; \
	trap cleanup INT; \
	./$(OUTPUT_DIR)/$(BOT_BINARY_NAME) & \
	./$(OUTPUT_DIR)/$(API_BINARY_NAME) & \
	cd web && pnpm dev & \
	wait; \
	cleanup

redis/start:
	@if [ -z "$$(docker ps -q -f name=$(REDIS_CONTAINER_NAME))" ]; then \
		if [ -z "$$(docker ps -aq -f name=$(REDIS_CONTAINER_NAME))" ]; then \
			echo "Starting Redis container $(REDIS_CONTAINER_NAME) on port $(REDIS_PORT)..."; \
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

redis/stop:
	@if [ -n "$$(docker ps -q -f name=$(REDIS_CONTAINER_NAME))" ]; then \
		echo "Stopping Redis container $(REDIS_CONTAINER_NAME)..."; \
		docker stop $(REDIS_CONTAINER_NAME) >/dev/null; \
	else \
		echo "Redis container $(REDIS_CONTAINER_NAME) is not running."; \
	fi

version:
	@echo "Version: $(GO_SOURCE_HASH)"

test:
	@echo "GOOSE_DBSTRING=$(GOOSE_DBSTRING)"

# Database
MIGRATIONS_DIR=internal/db/migrations

db/up:
	@echo "Running database migrations..."
	goose -dir $(MIGRATIONS_DIR) up

db/down:
	@echo "Rolling back database migrations..."
	goose -dir $(MIGRATIONS_DIR) down

db/reset:
	@echo "Resetting Goose Migrations"
	goose -dir $(MIGRATIONS_DIR) reset

db/status:
	@echo "Checking migration status..."
	goose -dir $(MIGRATIONS_DIR) status

db/_require-prod:
	@if [ -z "$(DB_URL_PROD)" ]; then \
		echo "DB_URL_PROD is not set. Export it or add it to .env"; \
		exit 1; \
	fi

db/up-prod: db/_require-prod
	@read -p "Type 'fuckitlol' to run Goose up on the production DB: " confirm; \
	if [ "$$confirm" != "fuckitlol" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi; \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) up

db/down-prod: db/_require-prod
	@read -p "Type 'fuckitlol' to roll back the production DB: " confirm; \
	if [ "$$confirm" != "fuckitlol" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi; \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) down

db/reset-prod: db/_require-prod
	@read -p "Type 'fuckitlol' to reset ALL production migrations: " confirm; \
	if [ "$$confirm" != "fuckitlol" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi; \
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) reset

db/status-prod: db/_require-prod
	@echo "Checking production migration status..."
	GOOSE_DBSTRING=$(DB_URL_PROD) goose -dir $(MIGRATIONS_DIR) status

# SQLC
db/generate:
	@echo "Generating SQLC code..."
	sqlc generate --file internal/db/sqlc.yaml

db/verify:
	@echo "Verifying SQLC queries..."
	sqlc compile --file internal/db/sqlc.yaml

# Better Auth / Drizzle

auth/generate:
	@echo "Running Better Auth CLI"
	cd web && npx @better-auth/cli generate --config src/lib/auth/auth.ts

drizzle/generate:
	@echo "Running Drizzle Generation..."
	cd web && npx drizzle-kit generate

drizzle/migrate:
	@echo "Running Drizzle Migration..."
	cd web && npx drizzle-kit migrate

drizzle/push:
	@echo "Pushing Drizzle schema to database..."
	cd web && npx drizzle-kit push

drizzle/studio:
	@echo "Starting Drizzle Studio..."
	cd web && npx drizzle-kit studio

drizzle/_require-prod:
	@if [ -z "$(BETTER_AUTH_DB_URL_PROD)" ]; then \
		echo "BETTER_AUTH_DB_URL_PROD is not set. Export it or add it to web/.env"; \
		exit 1; \
	fi

drizzle/migrate-prod: drizzle/_require-prod
	@read -p "Type 'fuckitlol' to run Drizzle migrate against production Better Auth DB: " confirm; \
	if [ "$$confirm" != "fuckitlol" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi; \
	cd web && BETTER_AUTH_DB_URL=$(BETTER_AUTH_DB_URL_PROD) npx drizzle-kit migrate

drizzle/push-prod: drizzle/_require-prod
	@read -p "Type 'fuckitlol' to push schema to production Better Auth DB: " confirm; \
	if [ "$$confirm" != "fuckitlol" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi; \
	cd web && BETTER_AUTH_DB_URL=$(BETTER_AUTH_DB_URL_PROD) npx drizzle-kit push

# Docker

docker/build:
	docker build --platform linux/amd64 --build-arg BETTER_AUTH_URL=$(BETTER_AUTH_URL) -t $(IMAGE_NAME):$(IMAGE_TAG) .

docker/tag:
	@if [ -z "$(NEW_TAG)" ]; then \
		echo "Usage: make docker-tag NEW_TAG=v0.1.0"; \
		exit 1; \
	fi
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):$(NEW_TAG)

docker/push:
	docker push ekkolyth/ekko-bot:dev
