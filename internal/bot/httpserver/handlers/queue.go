package handlers

import (
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

// QueueAdd handles adding a song to the queue
// This is called by the Web API with Discord session available
func QueueAdd(session *discordgo.Session, guildID string) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		var request queueAddRequest

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

		// Create a web context with Discord session from bot
		ctx := &context.Context{
			SourceType:             context.SourceTypeWeb,
			Session:                session, // Discord session is now available!
			GuildID:                guildID, // From environment variable
			VoiceChannelID:         request.VoiceChannelID,
			RequesterDiscordUserID: request.DiscordUserID,
			RequesterTag:           request.DiscordTag,
			Arguments:              map[string]string{"url": request.URL},
			ArgumentsRaw:           make(map[string]any),
		}

		logging.Info("Bot API: Adding song - user=" + request.DiscordUserID + " tag=" + request.DiscordTag + " guild=" + guildID + " channel=" + request.VoiceChannelID + " url=" + request.URL)

		// Add the song using the web context with Discord session
		discord.AddSong(ctx, false, request.URL)

		httpx.RespondJSON(write, http.StatusCreated, map[string]any{
			"ok":         true,
			"youtubeUrl": request.URL,
			"message":    "Song added to queue",
		})
	}
}

// Health returns a simple health check
func Health() http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		httpx.RespondJSON(write, http.StatusOK, map[string]any{
			"status": "ok",
			"service": "bot-internal-api",
		})
	}
}
