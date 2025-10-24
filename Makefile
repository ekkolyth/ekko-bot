# Set Environment Variables
BOT_BINARY_NAME=bot-server
API_BINARY_NAME=api-server
OUTPUT_DIR=bin

# Use the Go Compiler
GOBUILD=go build
GO_SOURCE_HASH:=$(shell find . -name "*.go" | sort | xargs cat | sha1sum | cut -c1-8)

# Load environment variables
include .env
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

# Install web dependencies if needed
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

# Database migration commands
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

# SQLC code generation
db/generate:
	@echo "Generating SQLC code..."
	sqlc generate --file internal/db/sqlc.yaml

db/verify:
	@echo "Verifying SQLC queries..."
	sqlc compile --file internal/db/sqlc.yaml

drizzle/generate:
	@echo "Running Drizzle Generation..."
	cd web && npx drizzle-kit generate

drizzle/migrate:
	@echo "Running Drizzle Migration..."
	cd web && npx drizzle-kit migrate
