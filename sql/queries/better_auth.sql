-- Better Auth queries

-- name: GetUserByID :one
SELECT * FROM "user" WHERE "id" = $1;

-- name: GetUserByEmail :one
SELECT * FROM "user" WHERE "email" = $1;

-- name: CreateUser :one
INSERT INTO "user" ("id", "name", "email", "emailVerified", "image")
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateUser :one
UPDATE "user" 
SET "name" = $2, "email" = $3, "emailVerified" = $4, "image" = $5, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM "user" WHERE "id" = $1;

-- name: GetSessionByID :one
SELECT * FROM "session" WHERE "id" = $1;

-- name: GetSessionByToken :one
SELECT * FROM "session" WHERE "token" = $1;

-- name: GetSessionsByUserID :many
SELECT * FROM "session" WHERE "userId" = $1;

-- name: CreateSession :one
INSERT INTO "session" ("id", "expiresAt", "token", "ipAddress", "userAgent", "userId")
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateSession :one
UPDATE "session" 
SET "expiresAt" = $2, "ipAddress" = $3, "userAgent" = $4, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $1
RETURNING *;

-- name: DeleteSession :exec
DELETE FROM "session" WHERE "id" = $1;

-- name: DeleteExpiredSessions :exec
DELETE FROM "session" WHERE "expiresAt" < CURRENT_TIMESTAMP;

-- name: GetAccountByID :one
SELECT * FROM "account" WHERE "id" = $1;

-- name: GetAccountByProvider :one
SELECT * FROM "account" WHERE "providerId" = $1 AND "accountId" = $2;

-- name: GetAccountsByUserID :many
SELECT * FROM "account" WHERE "userId" = $1;

-- name: CreateAccount :one
INSERT INTO "account" ("id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdateAccount :one
UPDATE "account" 
SET "accessToken" = $2, "refreshToken" = $3, "idToken" = $4, "accessTokenExpiresAt" = $5, "refreshTokenExpiresAt" = $6, "scope" = $7, "password" = $8, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = $1
RETURNING *;

-- name: DeleteAccount :exec
DELETE FROM "account" WHERE "id" = $1;

-- name: GetVerificationByID :one
SELECT * FROM "verification" WHERE "id" = $1;

-- name: GetVerificationByIdentifier :one
SELECT * FROM "verification" WHERE "identifier" = $1;

-- name: CreateVerification :one
INSERT INTO "verification" ("id", "identifier", "value", "expiresAt")
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteVerification :exec
DELETE FROM "verification" WHERE "id" = $1;

-- name: DeleteExpiredVerifications :exec
DELETE FROM "verification" WHERE "expiresAt" < CURRENT_TIMESTAMP;