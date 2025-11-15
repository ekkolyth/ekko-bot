-- +goose Up
create table recently_played (
    id uuid primary key default gen_random_uuid(),
    guild_id text not null,
    voice_channel_id text not null,
    url text not null,
    title text,
    artist text,
    duration_seconds int not null default 0,
    thumbnail text,
    added_by text,
    added_by_id text,
    added_at timestamptz not null default CURRENT_TIMESTAMP
);

create index recently_played_channel_idx
    on recently_played (guild_id, voice_channel_id, added_at desc);

-- +goose Down
drop table if exists recently_played;

