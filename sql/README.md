# Bot Backend Database with SQLC and Goose

This directory contains the database setup for the Ekko Bot backend application using SQLC and Goose for type-safe database operations.

**Important**: This database is separate from the Better Auth database. Authentication is handled entirely in the `web/` package using Better Auth with its own PostgreSQL instance.

## Structure

```
sql/
├── migrations/           # Goose migrations for bot data
│   └── 001_bot_status.sql
├── schema/              # SQLC schema files for bot data
│   └── bot_status.sql
├── queries/             # SQLC query files for bot data
│   └── bot_status.sql
└── README.md           # This file
```

## Generated Code

SQLC generates Go code in `internal/db/`:
- `models.go` - Go structs for bot database tables
- `bot_status.sql.go` - Generated query functions for bot status
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

## Bot Data Tables

The bot backend database contains tables for bot-specific data:

### Tables
- `bot_status` - Bot activity and status tracking

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
    botStatusService := db.NewBotStatusService(database)

    // Get active bot status
    status, err := botStatusService.GetActiveBotStatus(ctx)
    if err != nil {
        // Handle error
    }

    // Update bot activity
    updatedStatus, err := botStatusService.UpdateBotActivity(ctx, &db.UpdateBotActivityParams{
        ID:       "bot-1",
        Activity: "Playing music",
    })
    if err != nil {
        // Handle error
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

The Better Auth frontend (in `/web/`) uses its own PostgreSQL database instance. The Go backend:

1. **Does NOT store auth data** - authentication is handled entirely by Better Auth
2. **Uses separate database** - bot data is stored in its own PostgreSQL instance
3. **Communicates via API** - the bot backend receives user context through API calls from the web frontend

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