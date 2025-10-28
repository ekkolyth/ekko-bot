package handlers

import (
	"net/http"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
)

func Health() http.HandlerFunc {
	start := time.Now()
	return func(w http.ResponseWriter, _ *http.Request) {
		httpx.RespondJSON(w, http.StatusOK, map[string]any{
			"ok":      true,
			"status":  "healthy",
			"uptime":  time.Since(start).String(),
			"service": "bot-internal-api",
		})
	}
}
