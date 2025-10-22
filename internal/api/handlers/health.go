package handlers

import (
	"net/http"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
)

func Health(w http.ResponseWriter, r *http.Request) {
	status := map[string]any{
		"status": "ok",
		"uptime": httpx.Uptime,
	}
	logging.Api("Health Check OK")
	httpx.RespondJSON(w, http.StatusOK, status)
}
