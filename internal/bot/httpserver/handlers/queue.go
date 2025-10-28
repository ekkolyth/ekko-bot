package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

type queueAddRequest struct {
	DiscordUserID  string `json:"discord_user_id"`
	DiscordTag     string `json:"discord_tag"`
	VoiceChannelID string `json:"voice_channel_id"`
	URL            string `json:"url"`
}

type queueAddResponse struct {
	OK         bool   `json:"ok"`
	YouTubeURL string `json:"youtube_url"`
	Message    string `json:"message,omitempty"`
}

func QueueAdd(session *discordgo.Session, guildID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var request queueAddRequest

		// Parse JSON request body
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			httpx.RespondError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
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

		// Create context with Discord session and guild ID
		ctx := &context.Context{
			SourceType:             context.SourceTypeWeb,
			Session:                session, // Pass the Discord session!
			GuildID:                guildID, // From environment variable
			VoiceChannelID:         request.VoiceChannelID,
			RequesterDiscordUserID: request.DiscordUserID,
			RequesterTag:           request.DiscordTag,
			Arguments:              map[string]string{"url": request.URL},
			ArgumentsRaw:           make(map[string]any),
		}

		logging.Info("Bot Internal API: queue.add discord_user_id=" + request.DiscordUserID + " discord_tag=" + request.DiscordTag + " guild_id=" + guildID + " voice_channel_id=" + request.VoiceChannelID)

		// Add the song using the context with Discord session
		discord.AddSong(ctx, false, request.URL)

		// Return success response
		response := queueAddResponse{
			OK:         true,
			YouTubeURL: request.URL,
			Message:    "Song added to queue successfully",
		}

		httpx.RespondJSON(w, http.StatusCreated, response)
	}
}