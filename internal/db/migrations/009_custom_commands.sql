-- +goose Up
create table custom_commands (
    id uuid primary key default gen_random_uuid(),
    guild_id text not null,
    name text not null,
    response text not null,
    created_at timestamptz not null default CURRENT_TIMESTAMP
);

create unique index custom_commands_guild_name_idx
    on custom_commands (guild_id, lower(name));

-- +goose Down
drop index if exists custom_commands_guild_name_idx;
drop table if exists custom_commands;


