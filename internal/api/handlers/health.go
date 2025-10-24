package handlers

import (
	"net/http"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

func Health(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(context.StartTime)
	status := map[string]any{
		"status": "ok",
		"uptime": uptime.String(),
	}
	logging.Api("Health Check OK")
	httpx.RespondJSON(w, http.StatusOK, status)
}
