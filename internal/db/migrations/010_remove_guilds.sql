-- +goose Up
alter table if exists queue
    drop constraint if exists queue_guild_id_fkey;

alter table if exists queue_history
    drop constraint if exists queue_history_guild_id_fkey;

alter table if exists recently_played
    drop constraint if exists recently_played_guild_id_fkey;

alter table if exists guild_config
    drop constraint if exists guild_config_guild_id_fkey;

alter table if exists custom_commands
    drop constraint if exists custom_commands_guild_id_fkey;

drop table if exists guilds;

-- +goose Down
create table if not exists guilds (
    id text not null primary key,
    is_active boolean not null default false,
    icon text,
    guild_owner_id text,
    joined_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

