package main

import (
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/bot/httpserver"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/handlers"
	"github.com/ekkolyth/ekko-bot/internal/logging"

	"github.com/bwmarrin/discordgo"
	"github.com/joho/godotenv"
)

func setup() {

	//Check .env
	if err := godotenv.Load(); err != nil {
		logging.Fatal("Error loading .env file", err)
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
	dg, err := discordgo.New("Bot " + context.Token)
	if err != nil {
		logging.Fatal("Error creating Discord session", err)
	}

	dg.AddHandler(handlers.HandleMessageCreate)
	dg.AddHandler(handlers.HandleInteractionCreate)

	err = dg.Open()

	discord.SetupSlashCommands(dg)

	if err != nil {
		logging.Fatal("Error opening connection", err)
	}
	defer dg.Close()
	
	// Start HTTP server for internal API (port 1338)
	// This allows the Web API to communicate with the bot
	botAPIPort := os.Getenv("BOT_INTERNAL_API_PORT")
	if botAPIPort == "" {
		botAPIPort = "1338" // Default port
	}
	
	logging.Info("Starting bot internal API server on port " + botAPIPort)
	router := httpserver.NewRouter(dg)
	
	// Run HTTP server in goroutine (non-blocking)
	go func() {
		if err := http.ListenAndServe(":"+botAPIPort, router); err != nil {
			logging.Fatal("Failed to start bot internal API server", err)
		}
	}()
	
	logging.Info("Version: " + context.GoSourceHash)
	logging.Info("Bot is running. Press CTRL-C to exit.")
	select {} // block forever
}
