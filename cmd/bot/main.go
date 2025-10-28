package main

import (
	stdcontext "context"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/handlers"
	"github.com/ekkolyth/ekko-bot/internal/logging"
	bothttpserver "github.com/ekkolyth/ekko-bot/internal/bot/httpserver"

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

	// Start HTTP server for internal API
	startBotHTTPServer(dg)

	logging.Info("Version: " + context.GoSourceHash)
	logging.Info("Bot is running. Press CTRL-C to exit.")
	select {} // block forever
}

func startBotHTTPServer(dg *discordgo.Session) {
	// Get port from environment variable
	port := os.Getenv("BOT_API_PORT")
	if port == "" {
		port = "1338" // Default port for bot internal API
	}

	// Validate port is a number
	if _, err := strconv.Atoi(port); err != nil {
		logging.Fatal("❌ Invalid BOT_API_PORT value: "+port, err)
	}

	// Get guild ID from environment
	guildID := os.Getenv("DISCORD_GUILD_ID")
	if guildID == "" {
		logging.Fatal("❌ DISCORD_GUILD_ID not set in .env file", nil)
	}

	// Create bot HTTP router
	router := bothttpserver.NewRouter(dg, guildID)

	// Configure HTTP server
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logging.Info("✅ Bot Internal API running on http://localhost:" + port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logging.Fatal("Bot HTTP server error: %s", err)
		}
	}()

	// Setup graceful shutdown for HTTP server
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		logging.Info("Bot HTTP server is shutting down...")

		ctx, cancel := stdcontext.WithTimeout(stdcontext.Background(), 30*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			logging.Fatal("Bot HTTP server forced to shutdown:", err)
		}
		logging.Info("Bot HTTP server exited")
	}()
}
