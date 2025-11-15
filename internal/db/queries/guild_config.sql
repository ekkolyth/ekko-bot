-- name: GetWelcomeConfig :one
SELECT guild_id, welcome_channel_id, welcome_message
FROM guild_config
WHERE guild_id = $1;

-- name: UpsertWelcomeConfig :one
INSERT INTO guild_config (guild_id, welcome_channel_id, welcome_message)
VALUES ($1, $2, $3)
ON CONFLICT (guild_id) DO UPDATE
SET welcome_channel_id = EXCLUDED.welcome_channel_id,
    welcome_message = EXCLUDED.welcome_message,
    updated_at = now()
RETURNING guild_id, welcome_channel_id, welcome_message;

