# Bot API Refactor Plan

## Problem Statement

Currently, the Web API (`cmd/api`) directly calls `discord.AddSong()` without a Discord session, causing crashes when the bot tries to send messages. The API server and Discord bot are separate processes, and the API has no access to the Discord session.

## Current Architecture

```
User → Web UI → Web API (cmd/api, port 8080) → discord.AddSong() with nil session → CRASH
                                                                                        ↓
                                                                             Bot (cmd/bot) has session
                                                                             but never called
```

**Existing Components:**

- ✅ Web API HTTP server (`cmd/api/main.go`) - port from `API_PORT`
- ✅ Web API router (`internal/api/httpserver/router.go`)
- ✅ Web API handlers (`internal/api/handlers/queue.go`)
- ✅ Discord bot (`cmd/bot/main.go`) - has Discord session
- ✅ SQLC database - queue, tracks, guilds
- ✅ Better Auth - handles user authentication

## Target Architecture

```
User/Postman → Web API (port 1337) → Bot Internal API (port 1338) → Discord
                    ↓                         ↓
                 Validates JWT          Has Discord Session
                 Extracts user               ↓
                                        SQLC Database
                                        Processes queue

Web UI (port 1339) → Web API (port 1337) → (same flow as above)
```

**Port Map:**

- **1337** - Web API (public-facing, for Postman/testing and Web UI calls)
- **1338** - Bot Internal API (internal only, called by Web API)
- **1339** - Web UI (frontend, already running)

**Key Principles:**

- **Single-tenant architecture** - One bot instance = one guild
- Guild ID stored in environment variable, not in API paths
- Bot is source of truth for Discord state
- Web API proxies requests to bot's internal API
- Bot has Discord session, handles all Discord interactions
- SQLC database already handles queue persistence
- Simple, clean API design (no JWT auth complexity for now)

## Implementation Plan

### Phase 1: Add HTTP Server to Bot

**Goal:** Make the bot expose internal HTTP endpoints

#### 1.1 Update `cmd/bot/main.go`

**Flow:**

1. Bot initializes Discord session (existing)
2. Create new HTTP server on port **1338**
3. Pass Discord session to HTTP router
4. Start HTTP server in goroutine (non-blocking)
5. Bot continues running Discord event loop
6. Both servers run simultaneously in same process

#### 1.2 Create Bot HTTP Router

**New file:** `internal/bot/httpserver/router.go`

**Flow:**

1. Accept Discord session as parameter
2. Read `DISCORD_GUILD_ID` from environment (the ONE guild this instance serves)
3. Initialize Chi router
4. Add standard middleware (RequestID, RealIP, Recoverer, Timeout)
5. Define simple routes (no guild_id in path - it's known from env!)
6. Pass Discord session + guild ID to handlers
7. Return configured router

**Endpoints:**

- `POST /internal/queue` - Add song to queue
- `GET /internal/queue` - Get queue (future)
- `DELETE /internal/queue/{item_id}` - Remove from queue (future)
- `GET /internal/health` - Health check (future)

#### 1.3 Create Bot HTTP Handlers

**New file:** `internal/bot/httpserver/handlers/queue.go`

**Flow:**

1. Accept Discord session and guild ID as closure parameters
2. Return HTTP handler function
3. Parse JSON request body:
   - `discord_user_id` (string)
   - `discord_tag` (string)
   - `voice_channel_id` (string)
   - `url` (string)
4. Validate all required fields are present
5. Create `context.Context` with:
   - **Session = Discord session** (passed from bot)
   - **GuildID = from environment** (passed from router)
   - SourceType = Web
   - VoiceChannelID, RequesterDiscordUserID, RequesterTag
6. Call existing `discord.AddSong(ctx, false, url)`
7. Return HTTP 201 with success response

**No guild_id in request!** - Container knows its guild from environment.

### Phase 2: Update Web API to Call Bot

**Goal:** Web API proxies requests to Bot's internal API

#### 2.1 Update `internal/api/handlers/queue.go`

**Current Flow (Broken):**

1. Web API receives request
2. Creates context with `Session: nil`
3. Calls `discord.AddSong()` directly
4. **CRASH** - no Discord session

**New Flow (Simple & Clean):**

1. Web API receives request from Web UI/Postman (port **1337**)
   - Endpoint: `POST /api/queue` (no guild_id needed!)
2. Parse request body (discord_user_id, discord_tag, voice_channel_id, url)
3. Read `BOT_INTERNAL_API_URL` from environment
4. Build target URL: `http://localhost:1338/internal/queue`
5. Create JSON payload with all fields
6. Make HTTP POST to bot's internal API (port **1338**)
7. Wait for response from bot
8. Forward bot's response to client
9. Return appropriate HTTP status code

**Guild ID?** - Not needed in API! Container serves one guild (from `DISCORD_GUILD_ID` env var)

#### 2.2 Add Environment Variable

**`.env` (root directory):**

```env
# Single-tenant configuration
DISCORD_GUILD_ID=320162956706971648

# Service URLs
BOT_INTERNAL_API_URL=http://localhost:1338
```

**Flow:**

- Bot reads `DISCORD_GUILD_ID` on startup (the ONE guild it serves)
- Web API reads `BOT_INTERNAL_API_URL` on startup
- Uses it to construct bot API URLs
- No guild_id in request paths - simpler API design

### Phase 3: Create Dockerfile

**Goal:** Basic containerization setup for future deployment

#### 3.1 Create Root Dockerfile

**New file:** `Dockerfile` (root directory)

**Flow:**

1. Use multi-stage build for efficiency
2. Stage 1: Build Go binaries (bot + API)
   - Copy Go source files
   - Download dependencies
   - Compile `cmd/bot` → binary
   - Compile `cmd/api` → binary
3. Stage 2: Build web UI
   - Copy web/ directory
   - Run `pnpm install`
   - Run `pnpm build`
4. Stage 3: Create minimal runtime image
   - Use Alpine Linux base
   - Copy compiled Go binaries from Stage 1
   - Copy web build artifacts from Stage 2
   - Set working directory
   - Expose ports **1337**, **1338**, **1339**
   - Define environment variables
   - Set up entrypoint to run both servers

#### 3.2 Create .dockerignore

**New file:** `.dockerignore`

**Purpose:**

- Exclude unnecessary files from Docker build context
- Speeds up build process
- Reduces image size

**Contents:**

- `node_modules/`
- `web/node_modules/`
- `.git/`
- `*.log`
- `.env` (secrets managed separately)
- `bin/`
- `tmp/`

#### 3.3 Docker Compose

**New file:** `docker-compose.yml`

**Purpose:**

- Orchestrate all services together
- Define database service
- Set up networking
- Manage environment variables
- Useful for local containerized testing

**Services:**

- bot-api (the main app container)
- postgres (database)
- Network between them

## Testing Checklist

**Phase 1 - Bot HTTP Server:**

- [ ] `DISCORD_GUILD_ID` set in `.env`
- [ ] Bot reads guild ID from environment on startup
- [ ] Bot starts successfully with both Discord connection and HTTP server
- [ ] Bot HTTP server listening on port **1338**
- [ ] Direct POST to `localhost:1338/internal/queue` adds song (no guild_id in path!)
- [ ] Bot sends Discord message "Added to queue"
- [ ] Song plays in Discord
- [ ] No nil pointer crashes

**Phase 2 - Web API Proxy:**

- [ ] Web API running on port **1337** (check `API_PORT` env var)
- [ ] `BOT_INTERNAL_API_URL` set in `.env`
- [ ] Update API route from `/api/guilds/{id}/queue` to `/api/queue` (simpler!)
- [ ] Postman POST to `localhost:1337/api/queue` succeeds
- [ ] Web API forwards to `localhost:1338/internal/queue` correctly
- [ ] Response returned to Postman with proper status code
- [ ] Update Web UI to call `/api/queue` instead of `/api/guilds/{id}/queue`
- [ ] Web UI (port **1339**) can add songs via Web API
- [ ] No crashes when adding songs from web
- [ ] Queue persists in SQLC database (already working)

**Phase 3 - Docker:**

- [ ] Dockerfile builds successfully
- [ ] Can build image: `docker build -t ekko-bot .`
- [ ] Container runs with proper environment variables
- [ ] Both bot and API accessible in container
- [ ] Web UI serves from container
- [ ] Database connection works in container
- [ ] Discord bot connects in container

## Implementation Notes

**Ports:**

- **1337** - Web API (Postman/testing, Web UI calls this)
- **1338** - Bot Internal API (called only by Web API)
- **1339** - Web UI (frontend)

**Error Handling:**

- Bot API returns proper HTTP status codes (201, 400, 500)
- Web API forwards responses to client
- Proper error messages in JSON responses

**Timeouts:**

- Web API → Bot API: 30 second timeout
- Allows time for song fetching and processing

**Single-Tenant Model:**

- Bot designed for ONE guild per instance
- Guild ID in environment variable, not in API paths
- Simpler code, no multi-tenancy complexity
- No authentication needed (each container is isolated)
- Docker containers will handle distribution later
- Each customer gets dedicated bot instance

**API Design Benefits:**

- `POST /api/queue` instead of `/api/guilds/{guild_id}/queue`
- No need to pass guild_id in every request
- Cleaner, more RESTful API
- Container knows its guild from environment

## Development vs Production

**Local Development:**

- Bot process: `make bot` (Discord + HTTP server on 1338)
- API process: `make api` (HTTP server on 1337)
- Web UI: `cd web && pnpm dev` (port 1339)
- All communicate via localhost

**Docker (Future Deployment):**

- Single container runs all components
- Each container configured with `DISCORD_GUILD_ID` environment variable
- Internal networking between services
- Kubernetes orchestration for multi-customer
- One instance per guild (single-tenant model)
- Bot API (1338) remains internal to container
- Web API (1337) exposed to internet
- Customer A → Instance A (GUILD_ID=123) → Guild 123
- Customer B → Instance B (GUILD_ID=456) → Guild 456
- Simple, isolated, scalable
