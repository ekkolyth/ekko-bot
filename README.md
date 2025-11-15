# 🎵 Ekko Bot

A full-stack Discord music bot with a modern web dashboard for queue management and bot control.

## 📋 Features

- 🎵 Play music from YouTube in Discord voice channels
- 🎮 Slash commands for bot control
- 🌐 Web dashboard for queue management
- 📊 Real-time queue visualization
- 🔐 Discord OAuth2 authentication
- 🎛️ Volume control and playback management
- 📜 Queue history tracking

## 🛠️ Tech Stack

### Frontend Web App
- **TanStack Start** - React SSR framework
- **Better Auth** - Authentication system
- **Drizzle ORM** - Type-safe database queries
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### API Service
- **Go** - Backend language
- **Chi Router** - HTTP routing
- **sqlc** - SQL code generation
- **PostgreSQL** - Database

### Discord Bot
- **discordgo** - Discord API wrapper
- **Opus** - Audio encoding
- **ffmpeg** - Audio processing
- **yt-dlp** - YouTube audio extraction

## 🚀 Deployment Options

### Option 1: Docker (Recommended)

The easiest way to deploy is using Docker, which runs all components in a single container.

```bash
# 1. Clone the repository
git clone https://github.com/ekkolyth/ekko-bot.git
cd ekko-bot

# 2. Create .env file (see DOCKER_DEPLOYMENT.md for full configuration)
cp .env.example .env
# Edit .env with your Discord credentials and settings

# 3. Start with Docker Compose
docker-compose up -d

# 4. View logs
docker-compose logs -f
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed Docker setup instructions.

### Option 2: Local Development

#### Prerequisites
- Go 1.23+
- Node.js 22+
- pnpm
- PostgreSQL 16+
- ffmpeg
- yt-dlp

#### Setup

```bash
# 1. Clone repository
git clone https://github.com/ekkolyth/ekko-bot.git
cd ekko-bot

# 2. Install Go dependencies
go mod download

# 3. Install web dependencies
cd web && pnpm install && cd ..

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Run database migrations
make db/migrate

# 6. Build and run all services
make go
```

## ⚙️ Configuration

### Required Environment Variables

```bash
# Discord
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Database (development)
GOOSE_DBSTRING=postgres://user:pass@localhost:5432/sqlc_dev

# Database (production deploys)
DB_URL=postgres://user:pass@postgres:5433/sqlc-prod
DB_URL_PROD=postgres://user:pass@host:5433/sqlc-prod

# Servers
API_PORT=3000
WEB_PORT=3001

# Authentication
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_URL_PROD=https://example.com
BETTER_AUTH_DB_URL=postgresql://user:pass@localhost:5432/better_auth_dev
BETTER_AUTH_DB_URL_PROD=postgresql://user:pass@host:5433/better-auth-prod
BETTER_AUTH_SECRET=your_secret_here
```

## 📚 Documentation

- [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md) - Complete Docker setup instructions
- [API Routes](./cmd/api/api-routes.md) - API endpoint documentation
- [Discord Auth Flow](./DISCORD_AUTH_FLOW.md) - Authentication implementation details
- [Dashboard Implementation](./DASHBOARD_IMPLEMENTATION.md) - Web dashboard architecture

## 🎮 Discord Commands

- `/play <song>` - Play a song or add it to queue
- `/pause` - Pause current playback
- `/skip` - Skip to next song
- `/stop` - Stop playback and clear queue
- `/queue` - Show current queue
- `/volume <level>` - Set volume (0-100)
- `/nuke` - Clear entire queue
- `/ping` - Check bot latency
- `/help` - Show all available commands

## 🔧 Development

### Build Commands

```bash
# Build all binaries
make build

# Build individual components
make build-bot
make build-api

# Run all services
make go

# Database operations
make db/generate    # Generate sqlc code
make db/migrate     # Run migrations

# Authentication
make auth/generate  # Generate Better Auth schemas
```

### Testing

```bash
# Run Go tests
go test ./...

# Run web tests
cd web && pnpm test
```

## 🐛 Troubleshooting

### Bot not responding
- Verify `DISCORD_BOT_TOKEN` is correct
- Check bot has proper Discord permissions
- Ensure bot is invited to your server with correct scopes

### Database connection errors
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and migrations are run

### Audio not playing
- Verify ffmpeg and yt-dlp are installed
- Check bot is in the correct voice channel
- Ensure bot has voice permissions

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⭐ Acknowledgments

Built with love for Discord music enthusiasts.
