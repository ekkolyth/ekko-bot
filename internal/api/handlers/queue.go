package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

type queueAdd struct {
	DiscordUserID  string `json:"discord_user_id"`
	DiscordTag     string `json:"discord_tag"`
	VoiceChannelID string `json:"voice_channel_id"`
	URL            string `json:"url"`
}

func QueueAdd() http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		var request queueAdd

		if err := httpx.DecodeJSON(write, read, &request, 1<<20); err != nil {
			httpx.RespondError(write, http.StatusBadRequest, err.Error())
			return
		}

		// Validate required fields
		if request.DiscordUserID == "" {
			httpx.RespondError(write, http.StatusBadRequest, "Missing discord_user_id")
			return
		}

		if request.VoiceChannelID == "" {
			httpx.RespondError(write, http.StatusBadRequest, "Missing voice_channel_id")
			return
		}

		if !httpx.IsValidURL(request.URL) {
			httpx.RespondError(write, http.StatusBadRequest, "Invalid URL")
			return
		}

		logging.Info("Web API: Proxying queue.add request - user=" + request.DiscordUserID + " tag=" + request.DiscordTag + " url=" + request.URL)

		// Get bot internal API URL from environment
		botAPIURL := os.Getenv("BOT_INTERNAL_API_URL")
		if botAPIURL == "" {
			botAPIURL = "http://localhost:1338" // Default
		}

		// Build target URL for bot's internal API
		targetURL := botAPIURL + "/internal/queue"

		// Create JSON payload
		payload, err := json.Marshal(request)
		if err != nil {
			logging.Error("Failed to marshal request: " + err.Error())
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to process request")
			return
		}

		// Create HTTP client with timeout
		client := &http.Client{
			Timeout: 30 * time.Second, // Allow time for song fetching
		}

		// Make POST request to bot's internal API
		resp, err := client.Post(targetURL, "application/json", bytes.NewBuffer(payload))
		if err != nil {
			logging.Error("Failed to call bot internal API: " + err.Error())
			httpx.RespondError(write, http.StatusBadGateway, "Failed to communicate with bot")
			return
		}
		defer resp.Body.Close()

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			logging.Error("Failed to read bot API response: " + err.Error())
			httpx.RespondError(write, http.StatusBadGateway, "Failed to read bot response")
			return
		}

		// Forward response status code
		write.Header().Set("Content-Type", "application/json")
		write.WriteHeader(resp.StatusCode)
		write.Write(body)
	}
}
