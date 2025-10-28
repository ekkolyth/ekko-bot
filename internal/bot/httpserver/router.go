package httpserver

import (
	"net/http"
	"os"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/ekkolyth/ekko-bot/internal/bot/httpserver/handlers"
	"github.com/ekkolyth/ekko-bot/internal/logging"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// NewRouter creates a new HTTP router for the bot's internal API
// This API is called by the Web API to interact with Discord
func NewRouter(session *discordgo.Session) http.Handler {
	// Read guild ID from environment - this is the ONE guild this bot instance serves
	guildID := os.Getenv("DISCORD_GUILD_ID")
	if guildID == "" {
		logging.Fatal("DISCORD_GUILD_ID environment variable not set", nil)
	}

	logging.Info("Bot HTTP server configured for guild: " + guildID)

	router := chi.NewRouter()

	// Standard middleware
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(30 * time.Second)) // Allow time for song fetching

	// Internal API routes - no authentication needed (internal only)
	router.Route("/internal", func(r chi.Router) {
		// Queue endpoints
		r.Post("/queue", handlers.QueueAdd(session, guildID))
		r.Get("/health", handlers.Health())
	})

	return router
}
