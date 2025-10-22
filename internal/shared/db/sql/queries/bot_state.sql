-- Bot state queries

-- name: GetBotStatus :one
SELECT * FROM "bot_state" WHERE id = $1;

-- name: GetActiveBotStatus :one
SELECT * FROM "bot_state" WHERE is_active = true LIMIT 1;

-- name: CreateBotStatus :one
INSERT INTO "bot_state" (id, is_active, current_activity)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateBotStatus :one
UPDATE "bot_state"
SET is_active = $2, "current_activity" = $3, "updated_at" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: UpdateBotActivity :one
UPDATE "bot_state"
SET current_activity = $2, "updated_at" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: UpdateBotActiveStatus :one
UPDATE "bot_state"
SET is_active = $2, "updated_at" = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteBotStatus :exec
DELETE FROM "bot_state" WHERE id = $1;

-- name: ListAllBotStatuses :many
SELECT * FROM "bot_state" ORDER BY created_at DESC;
