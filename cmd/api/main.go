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

func getenvDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			log.Println("Warning: .env present but could not be loaded:", err)
		}
	}

	port := getenvDefault("API_PORT", "1337")
	if _, err := strconv.Atoi(port); err != nil {
		log.Fatal("Invalid API_PORT value:", port)
	}

	// DB init
	ctx := context.Background()
	dbService, err := db.NewService(ctx)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer dbService.DB.Close()
	logging.Info("Database connection established")

	// Discord
	discordToken := os.Getenv("DISCORD_BOT_TOKEN")
	if discordToken == "" {
		log.Fatal("DISCORD_BOT_TOKEN is required")
	}
	dg, err := discordgo.New("Bot " + discordToken)
	if err != nil {
		log.Fatal("Error creating Discord session:", err)
	}
	if err := dg.Open(); err != nil {
		log.Fatal("Error opening Discord connection:", err)
	}
	defer dg.Close()
	handlers.SetDiscordSession(dg)

	router := httpserver.NewRouter(dbService)
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logging.Info("✅ API listening on :%s (all interfaces)", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logging.Fatal("%s", err)
		}
	}()

	<-quit
	log.Println("Server is shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logging.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited")
}
