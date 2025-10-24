package httpserver

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/ekkolyth/ekko-bot/internal/api/handlers"
)

func NewRouter() http.Handler {
	router := chi.NewRouter()

	// standard middleware
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(15 * time.Second))

	allowedOrigins := envList("CORS_ALLOWED_ORIGINS")

	// cors
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{
			"Accept",
			"Accept-Language",
			"Content-Type",
			"Authorization",
			"Origin",
			"Referer",
		},
		ExposedHeaders:   []string{  "Location",
			"X-Request-ID",
			"Retry-After",
			"RateLimit-Limit",
			"RateLimit-Remaining",
			"RateLimit-Reset",
			"X-Guild-ID",},
		AllowCredentials: false,
		MaxAge:           1800, // 1 Hour
	}))

	// Healthcheck
	router.Get("/api/healthz", handlers.Health)

	//
	router.Route("/api", func(api chi.Router) {
		api.Route("/queue", func(query chi.Router){
			query.Post("/", handlers.QueueAdd)
		})
	})

	return router
}














func envList(key string) []string {
  v := os.Getenv(key)
  if v == "" { return nil }
  parts := strings.Split(v, ",")
  for i := range parts { parts[i] = strings.TrimSpace(parts[i]) }
  return parts
}
