# Database Integration with Better Auth, SQLC, and Goose

This directory contains the unified database setup for the Ekko Bot application, integrating Better Auth migrations with SQLC and Goose for type-safe database operations.

## Structure

```
sql/
├── migrations/           # Goose migrations (including Better Auth)
│   └── 001_better_auth_tables.sql
├── schema/              # SQLC schema files
│   └── better_auth.sql
├── queries/             # SQLC query files
│   └── better_auth.sql
└── README.md           # This file
```

## Generated Code

SQLC generates Go code in `internal/db/`:
- `models.go` - Go structs for all database tables
- `better_auth.sql.go` - Generated query functions
- `db.go` - Database connection and query setup
- `querier.go` - Interface for all database operations
- `connection.go` - Database connection management
- `service.go` - High-level service wrappers

## Available Commands

### Migration Commands
```bash
# Run all pending migrations
make migrate-up

# Rollback the last migration
make migrate-down

# Check migration status
make migrate-status

# Create a new migration
make migrate-create NAME=your_migration_name
```

### SQLC Commands
```bash
# Generate Go code from SQL queries
make sqlc-generate

# Verify SQL queries are valid
make sqlc-verify
```

### Development Workflow
```bash
# Set up database and generate code
make db-setup

# Full development setup (migrate + generate + build)
make dev
```

## Better Auth Integration

The Better Auth tables are now managed by Goose and accessible through SQLC:

### Tables
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth/SSO accounts
- `verification` - Email verification tokens

### Usage Example

```go
package main

import (
    "context"
    "github.com/ekkolyth/ekko-bot/internal/db"
)

func main() {
    // Initialize database connection
    ctx := context.Background()
    database, err := db.NewDBFromEnv(ctx)
    if err != nil {
        panic(err)
    }
    defer database.Close()

    // Use the generated services
    userService := db.NewUserService(database)
    sessionService := db.NewSessionService(database)

    // Create a user
    user, err := userService.GetUserByEmail(ctx, "user@example.com")
    if err != nil {
        // Handle error
    }

    // Validate a session
    user, session, err := sessionService.ValidateSession(ctx, "session_token")
    if err != nil {
        // Handle invalid session
    }
}
```

## Adding New Migrations

1. Create a new migration:
   ```bash
   make migrate-create NAME=add_discord_users_table
   ```

2. Edit the generated file in `sql/migrations/`

3. Run the migration:
   ```bash
   make migrate-up
   ```

4. Add corresponding schema files for SQLC if needed

5. Generate new Go code:
   ```bash
   make sqlc-generate
   ```

## Database Connection

The database connection is configured via the `DB_URL` environment variable:

```bash
DB_URL=postgres://username:password@host:port/database
```

## Integration with Better Auth Frontend

The Better Auth frontend (in `/web/`) will continue to work with the same database tables. The Go backend can now:

1. Read user data created by Better Auth
2. Create additional tables that reference Better Auth users
3. Perform complex queries joining Better Auth tables with custom tables
4. Maintain data consistency across both systems

## Best Practices

1. **Always use transactions** for operations that modify multiple tables
2. **Use the generated services** rather than raw queries when possible
3. **Keep migrations small and focused** - one logical change per migration
4. **Test migrations** on a copy of production data before applying
5. **Use proper error handling** - the generated code returns descriptive errors

## Troubleshooting

### Migration Issues
- Check database connection with `make migrate-status`
- Verify migration files are valid SQL
- Use `make migrate-down` to rollback if needed

### SQLC Issues
- Ensure schema files match your actual database structure
- Run `make sqlc-verify` to check query syntax
- Regenerate code after schema changes with `make sqlc-generate`