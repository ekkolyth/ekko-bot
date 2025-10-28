### Phase 3: Add JWT Authentication (Future)

**Goal:** Secure communication between services

#### 3.1 Enable Better Auth JWT Plugin

**File:** `web/src/lib/auth/auth.ts`

**Flow:**

1. Import JWT plugin from Better Auth
2. Add to plugins array in auth configuration
3. Better Auth now generates JWTs on sign-in
4. JWTs include user claims (user_id, discord_id, etc.)

#### 3.2 Add JWT to Web API Requests

**File:** Update TanStack Query hooks in `web/src/hooks/`

**Flow:**

1. Get current session using `authClient.getSession()`
2. Extract JWT token from session
3. Include in `Authorization: Bearer {token}` header
4. All API requests now include JWT

#### 3.3 Add JWT Middleware to Web API

**New file:** `internal/api/middleware/auth.go`

**Flow:**

1. Middleware intercepts all requests to Web API (port **1337**)
2. Extract `Authorization` header
3. Parse JWT token
4. Validate signature using `JWT_SECRET`
5. Verify token not expired
6. Extract user claims (user_id, discord_id)
7. Store claims in request context
8. Pass to handlers
9. If invalid, return 401 Unauthorized

#### 3.4 Add JWT Middleware to Bot API

**New file:** `internal/bot/httpserver/middleware/auth.go`

**Flow:**

1. Middleware intercepts all requests to Bot API (port **1338**)
2. Extract `Authorization` header from Web API request
3. Validate JWT using same `JWT_SECRET`
4. Ensure request came from authenticated Web API
5. If invalid, return 401 Unauthorized
6. Prevents unauthorized direct access to bot

**Environment Variable:**

```env
JWT_SECRET=<same-secret-as-better-auth>
```

Both Web API and Bot API share this secret for validation.

### Phase 4: Database Integration

**Goal:** Use existing SQLC for queue persistence

#### 4.1 Bot Handlers Write to Database

**Flow:**

1. Bot receives queue request via HTTP (port **1338**)
2. Validates all required fields
3. Calls `discord.AddSong()` with proper context
4. `AddSong()` writes to SQLC database (queue table)
5. Returns HTTP 201 immediately
6. Queue processing happens asynchronously

#### 4.2 Bot Process Queue Reads from Database

**Flow:**

1. `discord.ProcessQueue()` runs in background goroutine (existing)
2. Polls SQLC database for queue items
3. For each item:
   - Fetch song data
   - Join voice channel
   - Stream audio to Discord
   - Mark as played in database
4. Queue persists across bot restarts (already implemented)

**No changes needed** - this already works via SQLC.

## Benefits

✅ **No More Crashes** - Bot has Discord session  
✅ **Clean Separation** - Web API and Bot are independent processes  
✅ **Scalable** - Web API can scale horizontally, Bot stays single instance  
✅ **Database Persistence** - Queue survives restarts (already exists via SQLC)  
✅ **SaaS-Ready** - Easy to add multi-tenancy later  
✅ **Secure** - JWT authentication between services (Phase 3)

## Migration Steps

### Step 1: Implement Bot HTTP Server (Phase 1)

1. Create `internal/bot/httpserver/router.go`
2. Create `internal/bot/httpserver/handlers/queue.go`
3. Update `cmd/bot/main.go` to run HTTP server on port **1338**
4. Test: `curl -X POST localhost:1338/internal/guilds/{id}/queue` with JSON body

### Step 2: Update Web API (Phase 2)

1. Add `BOT_INTERNAL_API_URL=http://localhost:1338` to `.env`
2. Update `internal/api/handlers/queue.go` to forward requests to bot API
3. Ensure Web API is running on port **1337** (configurable via `API_PORT`)
4. Test in Postman: `POST localhost:1337/api/guilds/{id}/queue`
5. Test via Web UI: Add song → should work without crash

### Step 3: Add JWT Auth (Phase 3 - Later)

1. Enable Better Auth JWT plugin
2. Add JWT middleware to both APIs
3. Update web app to send JWT

### Step 4: Verify Database Integration (Phase 4)

- Already works via SQLC
- Verify queue persists across bot restarts

TO DO LIST

- [ ] Web UI includes JWT in requests
- [ ] Web API validates JWT
- [ ] Bot API validates JWT from Web API
- [ ] Unauthenticated requests return 401

- [ ] Queue items written to SQLC database
- [ ] Queue persists across bot restarts
- [ ] Bot process queue reads from database
