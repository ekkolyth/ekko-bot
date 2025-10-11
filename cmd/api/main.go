package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

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

	router := chi.NewRouter()

	// CORS Middleware
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: false,
		MaxAge:           300, // 5 minute cache
	}))

	// Health Check
	router.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// Example Route
	router.Get("/api/music", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Hello Music World"}`))
		logging.ApiLog("Incoming API Request")
	})

	// Configure HTTP server
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Println("✅ API running on http://localhost:" + port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("❌ Server error:", err)
	}
}
