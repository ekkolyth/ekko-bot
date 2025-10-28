package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/logging"
	"github.com/go-chi/chi/v5"
)

type queueAdd struct {
	DiscordUserID  string `json:"discord_user_id"`
	DiscordTag     string `json:"discord_tag"`
	VoiceChannelID string `json:"voice_channel_id"`
	URL            string `json:"url"`
}

func QueueAdd() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract guild_id from URL path parameter (for backward compatibility)
		// For the new simplified route, guild_id is not required
		guildID := chi.URLParam(r, "guild_id")
		if guildID == "" {
			// For simplified route, we'll let the bot handle guild validation
			guildID = "simplified" // Placeholder, bot will use environment variable
		}

		var request queueAdd

		if err := httpx.DecodeJSON(w, r, &request, 1<<20); err != nil {
			httpx.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Validate required fields
		if request.DiscordUserID == "" {
			httpx.RespondError(w, http.StatusBadRequest, "Missing discord_user_id")
			return
		}

		if request.VoiceChannelID == "" {
			httpx.RespondError(w, http.StatusBadRequest, "Missing voice_channel_id")
			return
		}

		if !httpx.IsValidURL(request.URL) {
			httpx.RespondError(w, http.StatusBadRequest, "Invalid URL")
			return
		}

		// Get bot internal API URL from environment
		botAPIURL := os.Getenv("BOT_INTERNAL_API_URL")
		if botAPIURL == "" {
			httpx.RespondError(w, http.StatusInternalServerError, "Bot internal API URL not configured")
			return
		}

		// Build target URL for bot internal API
		targetURL := fmt.Sprintf("%s/internal/queue", botAPIURL)

		// Create JSON payload for bot API
		payload := map[string]string{
			"discord_user_id":  request.DiscordUserID,
			"discord_tag":      request.DiscordTag,
			"voice_channel_id": request.VoiceChannelID,
			"url":              request.URL,
		}

		jsonPayload, err := json.Marshal(payload)
		if err != nil {
			httpx.RespondError(w, http.StatusInternalServerError, "Failed to marshal request: "+err.Error())
			return
		}

		logging.Info("Web API: Proxying request to bot internal API at " + targetURL)

		// Create HTTP client with timeout
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		// Make request to bot internal API
		req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(jsonPayload))
		if err != nil {
			httpx.RespondError(w, http.StatusInternalServerError, "Failed to create request: "+err.Error())
			return
		}

		req.Header.Set("Content-Type", "application/json")

		// Send request to bot
		resp, err := client.Do(req)
		if err != nil {
			httpx.RespondError(w, http.StatusServiceUnavailable, "Failed to reach bot internal API: "+err.Error())
			return
		}
		defer resp.Body.Close()

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			httpx.RespondError(w, http.StatusInternalServerError, "Failed to read bot response: "+err.Error())
			return
		}

		// Forward the response from bot to client
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		w.Write(body)

		logging.Info("Web API: Successfully proxied request to bot internal API")
	}
}
