-- Bot status queries

-- name: GetBotStatus :one
SELECT * FROM "bot_status" WHERE "id" = $1;

-- name: GetActiveBotStatus :one
SELECT * FROM "bot_status" WHERE "isActive" = true LIMIT 1;

-- name: CreateBotStatus :one
INSERT INTO "bot_status" ("id", "isActive", "activity")
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateBotStatus :one
UPDATE "bot_status" 
SET "isActive" = $2, "activity" = $3, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $1
RETURNING *;

-- name: UpdateBotActivity :one
UPDATE "bot_status" 
SET "activity" = $2, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $1
RETURNING *;

-- name: UpdateBotActiveStatus :one
UPDATE "bot_status" 
SET "isActive" = $2, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $1
RETURNING *;

-- name: DeleteBotStatus :exec
DELETE FROM "bot_status" WHERE "id" = $1;

-- name: ListAllBotStatuses :many
SELECT * FROM "bot_status" ORDER BY "createdAt" DESC;