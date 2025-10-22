--+goose Up
create table guild_config (
    guild_id text primary key references guilds(id) on delete cascade,
    default_vc text,
    volume int not null default 100 check (volume between 0 and 200),
    language_filter_enabled boolean not null default false,
    updated_at timestamptz not null default now()
);

--+goose Down
drop table if exists guild_config;
