package main

import (
	stdctx "context"
	"os"
	"os/exec"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/cache"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/handlers"
	"github.com/ekkolyth/ekko-bot/internal/logging"

	"github.com/bwmarrin/discordgo"
	"github.com/joho/godotenv"
)

func setup() {

	// Check .env file (optional - env vars may be provided by docker-compose)
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			logging.Fatal("Error loading .env file", err)
		}
	}
	//Check Discord Token
	context.Token = os.Getenv("DISCORD_BOT_TOKEN")
	if context.Token == "" {
		logging.Fatal("Token not found - check .env file", nil)
	}

	// Check yt-dlp
	if _, err := exec.LookPath("yt-dlp"); err != nil {
		logging.Fatal("yt-dlp not found. Please install it with: pip install yt-dlp", err)
	}

	// Check ffmpeg
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		logging.Fatal("ffmpeg not found. Please install it with your package manager", err)
	}

	// Parse disabled commands from .env
	disabled := os.Getenv("DISABLED_COMMANDS")
	for _, cmd := range strings.Split(disabled, ",") {
		cmd = strings.TrimSpace(cmd)
		if cmd != "" {
			context.DisabledCommands[cmd] = true
		}
	}
}

func main() {
	setup()

	redisClient, err := cache.InitRedis()
	if err != nil {
		logging.Fatal("Failed to connect to redis", err)
	}
	context.SetQueueStore(context.NewRedisQueueStore(redisClient))
	defer cache.CloseRedis(stdctx.Background())

	dg, err := discordgo.New("Bot " + context.Token)
	if err != nil {
		logging.Fatal("Error creating Discord session", err)
	}

	dg.AddHandler(handlers.HandleMessageCreate)
	dg.AddHandler(handlers.HandleInteractionCreate)
	dg.AddHandler(handlers.HandleVoiceStateUpdate)

	err = dg.Open()

	discord.SetupSlashCommands(dg)

	if err != nil {
		logging.Fatal("Error opening connection", err)
	}
	defer dg.Close()
	logging.Info("Version: " + context.GoSourceHash)
	logging.Info("Bot is running. Press CTRL-C to exit.")
	select {} // block forever
}
