-- name: GetWelcomeConfig :one
SELECT guild_id, welcome_channel_id, welcome_message, welcome_embed_title
FROM guild_config
WHERE guild_id = $1;

-- name: UpsertWelcomeConfig :one
INSERT INTO guild_config (guild_id, welcome_channel_id, welcome_message, welcome_embed_title)
VALUES ($1, $2, $3, $4)
ON CONFLICT (guild_id) DO UPDATE
SET welcome_channel_id = EXCLUDED.welcome_channel_id,
    welcome_message = EXCLUDED.welcome_message,
    welcome_embed_title = EXCLUDED.welcome_embed_title,
    updated_at = now()
RETURNING guild_id, welcome_channel_id, welcome_message, welcome_embed_title;

