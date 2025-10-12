-- +goose Up
-- +goose StatementBegin
-- Bot status table
create table "bot_status" (
    "id" text not null primary key,
    "isActive" boolean not null default false,
    "activity" text,
    "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists "bot_status";
-- +goose StatementEnd