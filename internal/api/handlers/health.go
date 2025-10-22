package handlers

import (
	"net/http"
	"time"
)


func Health(w http.ResponseWriter, r *http.Request) {
	status := map[string]any{
		"status": "ok",
		"uptime": time.Since(startTime).String(),
	}
	RespondJSON(w, http.StatusOK, status)
}
