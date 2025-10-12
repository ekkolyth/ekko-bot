-- Bot status table schema for SQLC

create table "bot_status" (
    "id" text not null primary key,
    "isActive" boolean not null default false,
    "activity" text,
    "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
    "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);