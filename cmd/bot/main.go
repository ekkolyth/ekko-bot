package main

import (
	"os"
	"os/exec"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/bot/handlers"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"

	"github.com/bwmarrin/discordgo"
	"github.com/joho/godotenv"
)

func setup() {

	//Check .env
	if err := godotenv.Load(); err != nil {
		logging.Fatal("Error loading .env file", err)
	}
	//Check Discord Token
	state.Token = os.Getenv("DISCORD_BOT_TOKEN")
	if state.Token == "" {
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
			state.DisabledCommands[cmd] = true
		}
	}
}

func main() {
	setup()
	dg, err := discordgo.New("Bot " + state.Token)
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
	logging.Info("Version: " + state.GoSourceHash)
	logging.Info("Bot is running. Press CTRL-C to exit.")
	select {} // block forever
}
