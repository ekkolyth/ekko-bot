-- +goose Up
alter table guild_config
    add column if not exists welcome_channel_id text,
    add column if not exists welcome_message text;

-- +goose Down
alter table if exists guild_config
    drop column if exists welcome_channel_id,
    drop column if exists welcome_message;

