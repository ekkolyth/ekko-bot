# Environment Variables
BOT_BINARY_NAME=bot-server
API_BINARY_NAME=api-server
OUTPUT_DIR=bin

# Docker
IMAGE_NAME ?= ekkolyth/ekko-bot
IMAGE_TAG ?= dev

# Use Go
GOBUILD=go build
GO_SOURCE_HASH:=$(shell find . -name "*.go" | sort | xargs cat | sha1sum | cut -c1-8)

-include .env
export

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

go: build
	@echo "Starting bot server, API server, and web UI..."
	@echo "Press Ctrl+C to stop all servers"
	@trap 'kill %1 %2 %3; exit 0' INT; \
	./$(OUTPUT_DIR)/$(BOT_BINARY_NAME) & \
	./$(OUTPUT_DIR)/$(API_BINARY_NAME) & \
	cd web && pnpm dev & \
	wait

version:
	@echo "Version: $(GO_SOURCE_HASH)"

test:
	@echo "DB_URL=$(DB_URL)"

# Database
db/up:
	@echo "Running database migrations..."
	goose -dir sql/migrations up

db/down:
	@echo "Rolling back database migrations..."
	goose -dir sql/migrations down

db/reset:
	@echo "Resetting Goose Migrations"
	goose -dir sql/migrations reset

db/status:
	@echo "Checking migration status..."
	goose -dir sql/migrations status

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

# Docker

docker/build:
	docker build --platform linux/amd64 --build-arg BETTER_AUTH_URL=$(BETTER_AUTH_URL) -t $(IMAGE_NAME):$(IMAGE_TAG) .

docker/tag:
	@if [ -z "$(NEW_TAG)" ]; then \
		echo "Usage: make docker-tag NEW_TAG=v0.1.0"; \
		exit 1; \
	fi
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):$(NEW_TAG)
