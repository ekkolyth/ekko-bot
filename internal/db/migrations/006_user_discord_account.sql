-- +goose Up
-- Create user_discord_account table for mapping app users to Discord identities
CREATE TABLE IF NOT EXISTS user_discord_account (
    app_user_id TEXT PRIMARY KEY,
    discord_user_id TEXT NOT NULL UNIQUE,
    display_tag TEXT NOT NULL,
    avatar_hash TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_discord_account_discord_user_id ON user_discord_account(discord_user_id);

-- +goose Down
DROP INDEX IF EXISTS idx_user_discord_account_discord_user_id;
DROP TABLE IF EXISTS user_discord_account;

