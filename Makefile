BOT_BINARY_NAME=bot-server
API_BINARY_NAME=api-server
OUTPUT_DIR=bin

# Choose the Go compiler
GOBUILD=go build
GO_SOURCE_HASH:=$(shell find . -name "*.go" | sort | xargs cat | sha1sum | cut -c1-8)

# Load environment variables
include .env
export

all: build

build: build-bot build-api

build-bot:
	mkdir -p $(OUTPUT_DIR)
	$(GOBUILD) -ldflags "-X 'github.com/ekkolyth/ekko-bot/internal/shared/state.GoSourceHash=$(GO_SOURCE_HASH)'" -o $(OUTPUT_DIR)/$(BOT_BINARY_NAME) -v ./cmd/bot

build-api:
	mkdir -p $(OUTPUT_DIR)
	$(GOBUILD) -o $(OUTPUT_DIR)/$(API_BINARY_NAME) -v ./cmd/api

clean:
	go clean
	rm -f $(OUTPUT_DIR)/$(BOT_BINARY_NAME)
	rm -f $(OUTPUT_DIR)/$(API_BINARY_NAME)

# Install web dependencies if needed
install-web-deps:
	@if [ ! -d "web/node_modules" ]; then \
		echo "Installing web dependencies..."; \
		cd web && pnpm install; \
	fi

# Start web UI
run-web: install-web-deps
	@echo "Starting web UI..."
	cd web && pnpm dev

run: build
	@echo "Starting bot server, API server, and web UI..."
	@echo "Bot server: Discord bot (connects to Discord API)"
	@echo "API server: http://localhost:$(API_PORT) (REST API)"
	@echo "Web UI: http://localhost:3000 (React frontend)"
	@echo "Press Ctrl+C to stop all servers"
	@trap 'kill %1 %2 %3; exit 0' INT; \
	./$(OUTPUT_DIR)/$(BOT_BINARY_NAME) & \
	./$(OUTPUT_DIR)/$(API_BINARY_NAME) & \
	$(MAKE) run-web & \
	wait

run-bot: build-bot
	@echo "Starting bot server..."
	./$(OUTPUT_DIR)/$(BOT_BINARY_NAME)

run-api: build-api
	@echo "Starting API server..."
	./$(OUTPUT_DIR)/$(API_BINARY_NAME)

test:
	go test -v ./...

version:
	@echo "Version: $(GO_SOURCE_HASH)"

docker-build:
	docker build -t $(BINARY_NAME) .

docker-network-create:
	docker network create musicbot-net || echo "Network already exists"

docker-run:
	$(MAKE) docker-network-create
	docker run -d --name $(BINARY_NAME) --network musicbot-net --user 1000:1000 --read-only -v /app/config:/app/config:ro --cap-drop ALL \
	--security-opt no-new-privileges --memory=1G --cpus=3 --pids-limit=40 --restart unless-stopped $(BINARY_NAME)

docker-logs:
	docker logs -f $(BINARY_NAME)

docker-start:
	docker start $(BINARY_NAME)

docker-stop:
	docker stop $(BINARY_NAME)

docker-rm:
	docker rm $(BINARY_NAME)

docker-rmi:
	docker rmi $(BINARY_NAME)

docker-kill:
	docker kill $(BINARY_NAME)

docker-network-rm:
	docker network rm musicbot-net || echo "Network does not exist"

docker-refresh-build: # Update the image with the latest code and restart the container
	-docker stop $(BINARY_NAME)
	-docker rm $(BINARY_NAME)
	$(MAKE) docker-build
	$(MAKE) docker-run

docker-clean: # Delete all resources related to the bot
	-docker stop $(BINARY_NAME)
	-docker rm $(BINARY_NAME)
	-docker rmi $(BINARY_NAME)
	-docker network rm musicbot-net || echo "Network does not exist"
