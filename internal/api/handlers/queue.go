package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
)

// QueueRequest defines the expected body when adding a new track.
type QueueRequest struct {
	URL     string `json:"url"`
	GuildID string `json:"guild_id"`
	UserID  string `json:"user_id"`
}

// QueueResponse defines what we send back to the frontend.
type QueueResponse struct {
	Status   string        `json:"status"`
	Message  string        `json:"message,omitempty"`
	Uptime   string        `json:"uptime"`
	QueuedAt time.Time     `json:"queued_at"`
	Request  QueueRequest  `json:"request"`
}

// QueueHandler handles POST requests to /api/music/queue.
func QueueHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpx.RespondJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
		return
	}

	var req QueueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body",
		})
		return
	}

	if req.URL == "" {
		httpx.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing required field: url",
		})
		return
	}

	// (Later) Insert queue entry into your DB via SQLC
	// e.g. db.AddToQueue(ctx, req.GuildID, req.UserID, req.URL)

	resp := QueueResponse{
		Status:   "ok",
		Message:  "Track queued successfully",
		QueuedAt: time.Now(),
		Request:  req,
	}

	httpx.RespondJSON(w, http.StatusOK, resp)
}
