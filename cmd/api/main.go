package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "syscall"
    "time"

    "github.com/bwmarrin/discordgo"
    "github.com/ekkolyth/ekko-bot/internal/api/handlers"
    "github.com/ekkolyth/ekko-bot/internal/api/httpserver"
    "github.com/ekkolyth/ekko-bot/internal/db"
    "github.com/ekkolyth/ekko-bot/internal/logging"
    "github.com/joho/godotenv"
)

var StartTime = time.Now()

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using default values")
	}

	// Get port from environment variable
	port := os.Getenv("API_PORT")
	if port == "" {
		log.Fatal("❌ API_PORT not set in .env file")
	}

	// Validate port is a number
	if _, err := strconv.Atoi(port); err != nil {
		log.Fatal("❌ Invalid API_PORT value:", port)
	}

    // Initialize database connection (for guilds, tracks, queue, etc.)
	ctx := context.Background()
	dbService, err := db.NewService(ctx)
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}
	defer dbService.DB.Close()

	logging.Info("✅ Database connection established")

    // Initialize Discord session for API to perform actions
    discordToken := os.Getenv("DISCORD_BOT_TOKEN")
    if discordToken == "" {
        log.Fatal("❌ DISCORD_BOT_TOKEN not set in .env file")
    }
    dg, err := discordgo.New("Bot " + discordToken)
    if err != nil {
        log.Fatal("❌ Error creating Discord session:", err)
    }
    if err := dg.Open(); err != nil {
        log.Fatal("❌ Error opening Discord connection:", err)
    }
    defer dg.Close()
    handlers.SetDiscordSession(dg)

	router := httpserver.NewRouter(dbService)

	// Configure HTTP server
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Setup graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		logging.Info("✅ API running on http://localhost:" + port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logging.Fatal("%s", err)
		}
	}()

	// Wait for shutdown signal
	<-quit
	log.Println("Server is shutting down...")

	// Shutdown Gracefully
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logging.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited")
}
