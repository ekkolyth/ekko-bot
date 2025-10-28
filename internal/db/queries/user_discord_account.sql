-- name: UpsertUserDiscordAccount :exec
INSERT INTO user_discord_account (app_user_id, discord_user_id, display_tag, avatar_hash, last_seen_at)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (app_user_id) 
DO UPDATE SET 
    discord_user_id = EXCLUDED.discord_user_id,
    display_tag = EXCLUDED.display_tag,
    avatar_hash = EXCLUDED.avatar_hash,
    last_seen_at = NOW();

-- name: GetDiscordIdentityByAppUserId :one
SELECT discord_user_id, display_tag, avatar_hash, last_seen_at
FROM user_discord_account
WHERE app_user_id = $1;

-- name: GetDiscordIdentityByDiscordUserId :one
SELECT app_user_id, display_tag, avatar_hash, last_seen_at
FROM user_discord_account
WHERE discord_user_id = $1;

