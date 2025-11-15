-- Custom command queries

-- name: ListCustomCommands :many
SELECT id, guild_id, name, response, created_at
FROM custom_commands
WHERE guild_id = $1
ORDER BY lower(name) ASC;

-- name: CreateCustomCommand :one
INSERT INTO custom_commands (guild_id, name, response)
VALUES ($1, $2, $3)
RETURNING id, guild_id, name, response, created_at;

-- name: DeleteCustomCommand :exec
DELETE FROM custom_commands
WHERE guild_id = $1 AND id = $2;

-- name: GetCustomCommandByName :one
SELECT id, guild_id, name, response, created_at
FROM custom_commands
WHERE guild_id = sqlc.arg(guild_id) AND lower(name) = lower(sqlc.arg(name))
LIMIT 1;

