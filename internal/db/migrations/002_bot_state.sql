-- +goose Up
create table bot_state (
    id text not null primary key,
    is_active boolean not null default false,
    current_activity text,
    created_at timestamptz default CURRENT_TIMESTAMP not null,
    updated_at timestamptz default CURRENT_TIMESTAMP not null
);

-- +goose Down
drop table if exists bot_state;
