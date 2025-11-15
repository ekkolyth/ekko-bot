-- +goose Up
create table queue_history (
    id uuid primary key default gen_random_uuid(),
    guild_id text not null,
    track_id uuid not null references tracks(id) on delete cascade,
    user_id text,
    user_name text,
    added_at timestamptz default CURRENT_TIMESTAMP not null
);

-- +goose Down
drop table if exists queue_history;
