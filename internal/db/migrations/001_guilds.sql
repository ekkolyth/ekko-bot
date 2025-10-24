--+goose Up
create table guilds (
    id text not null primary key,
    is_active boolean not null default false,
    icon text,
    guild_owner_id text,
    joined_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

--+goose Down
drop table if exists guilds;
