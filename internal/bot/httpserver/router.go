package httpserver

import (
	"net/http"
	"os"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	botHandlers "github.com/ekkolyth/ekko-bot/internal/bot/httpserver/handlers"
)

// NewRouter configures the bot's internal HTTP API.
// It reads DISCORD_GUILD_ID from the environment and wires handlers
// that operate with the provided Discord session.
func NewRouter(discordSession *discordgo.Session) http.Handler {
	router := chi.NewRouter()

	// standard middleware
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(30 * time.Second))

	guildID := os.Getenv("DISCORD_GUILD_ID")

	router.Route("/internal", func(r chi.Router) {
		// Health check
		r.Get("/health", botHandlers.Health())

		// Queue endpoints
		r.Post("/queue", botHandlers.QueueAdd(discordSession, guildID))
	})

	return router
}
