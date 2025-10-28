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

        // Proxy to Bot Internal API
        botURL := os.Getenv("BOT_INTERNAL_API_URL")
        if botURL == "" {
            // default per plan
            botURL = "http://localhost:1338"
        }
        target := botURL + "/internal/queue"

        payload, _ := json.Marshal(map[string]any{
            "discord_user_id":  request.DiscordUserID,
            "discord_tag":      request.DiscordTag,
            "voice_channel_id": request.VoiceChannelID,
            "url":              request.URL,
        })

        client := &http.Client{Timeout: 30 * time.Second}
        req, err := http.NewRequest(http.MethodPost, target, bytes.NewReader(payload))
        if err != nil {
            httpx.RespondError(write, http.StatusBadGateway, "Failed to create proxy request")
            return
        }
        req.Header.Set("Content-Type", "application/json")

        resp, err := client.Do(req)
        if err != nil {
            httpx.RespondError(write, http.StatusBadGateway, "Bot API unreachable")
            return
        }
        defer resp.Body.Close()

        // Forward status & body
        write.Header().Set("Content-Type", "application/json; charset=utf-8")
        write.WriteHeader(resp.StatusCode)
        if _, err := io.Copy(write, resp.Body); err != nil {
            logging.Warning("Failed to forward bot response: " + err.Error())
        }
    }
}
