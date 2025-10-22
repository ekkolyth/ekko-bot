-- +goose Up
create table tracks (
    id uuid primary key default gen_random_uuid(),
    source text,
    url text,
    title text,
    artist text,
    duration text,
    thumnail text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz default CURRENT_TIMESTAMP not null,
    updated_at timestamptz default CURRENT_TIMESTAMP not null
);

-- +goose Down
drop table if exists tracks;
