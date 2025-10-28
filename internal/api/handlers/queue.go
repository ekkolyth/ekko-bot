package handlers

import (
	"net/http"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
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
	return func(write http.ResponseWriter, read *http.Request) {
		// Extract guild_id from URL path parameter
		guildID := chi.URLParam(read, "guild_id")
		if guildID == "" {
			httpx.RespondError(write, http.StatusBadRequest, "Missing guild_id in URL")
			return
		}

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

		// Create a web context with Discord identity from request
		ctx := &context.Context{
			SourceType:             context.SourceTypeWeb,
			Session:                nil, // No Discord session for web actions
			GuildID:                guildID,
			VoiceChannelID:         request.VoiceChannelID,
			RequesterDiscordUserID: request.DiscordUserID,
			RequesterTag:           request.DiscordTag,
			Arguments:              map[string]string{"url": request.URL},
			ArgumentsRaw:           make(map[string]any),
		}

		logging.Info("Web action: queue.add discord_user_id=" + request.DiscordUserID + " discord_tag=" + request.DiscordTag + " guild_id=" + guildID + " voice_channel_id=" + request.VoiceChannelID)

		// Add the song using the web context
		discord.AddSong(ctx, false, request.URL)

		httpx.RespondJSON(write, http.StatusCreated, map[string]any{
			"ok":         true,
			"youtubeUrl": request.URL,
		})
	}
}
