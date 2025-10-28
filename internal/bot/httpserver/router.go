package httpserver

import (
	"net/http"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/ekkolyth/ekko-bot/internal/bot/httpserver/handlers"
)

func NewRouter(session *discordgo.Session, guildID string) http.Handler {
	router := chi.NewRouter()

	// Standard middleware
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(15 * time.Second))

	// Health check endpoint
	router.Get("/internal/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Internal API routes (no guild_id in path - it's known from environment!)
	router.Route("/internal", func(api chi.Router) {
		api.Route("/queue", func(queue chi.Router) {
			queue.Post("/", handlers.QueueAdd(session, guildID))
			// Future endpoints:
			// queue.Get("/", handlers.QueueGet(session, guildID))
			// queue.Delete("/{item_id}", handlers.QueueRemove(session, guildID))
		})
	})

	return router
}