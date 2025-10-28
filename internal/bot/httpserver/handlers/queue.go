package handlers

import (
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	appctx "github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

type queueAdd struct {
	DiscordUserID  string `json:"discord_user_id"`
	DiscordTag     string `json:"discord_tag"`
	VoiceChannelID string `json:"voice_channel_id"`
	URL            string `json:"url"`
}

// QueueAdd returns an http.HandlerFunc bound to the provided Discord session and guildID.
func QueueAdd(s *discordgo.Session, guildID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req queueAdd
		if err := httpx.DecodeJSON(w, r, &req, 1<<20); err != nil {
			httpx.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Validate required fields
		if req.DiscordUserID == "" {
			httpx.RespondError(w, http.StatusBadRequest, "Missing discord_user_id")
			return
		}
		if req.VoiceChannelID == "" {
			httpx.RespondError(w, http.StatusBadRequest, "Missing voice_channel_id")
			return
		}
		if !httpx.IsValidURL(req.URL) {
			httpx.RespondError(w, http.StatusBadRequest, "Invalid URL")
			return
		}

		// Build a web context that the Discord layer understands
		ctx := &appctx.Context{
			SourceType:             appctx.SourceTypeWeb,
			Session:                s,
			GuildID:                guildID,
			VoiceChannelID:         req.VoiceChannelID,
			RequesterDiscordUserID: req.DiscordUserID,
			RequesterTag:           req.DiscordTag,
			Arguments:              map[string]string{"url": req.URL},
			ArgumentsRaw:           make(map[string]any),
		}

		logging.Info("Bot API: queue.add user_id=" + req.DiscordUserID + " tag=" + req.DiscordTag + " guild_id=" + guildID + " voice_channel_id=" + req.VoiceChannelID)

		// Add the song via the existing Discord flow
		discord.AddSong(ctx, false, req.URL)

		httpx.RespondJSON(w, http.StatusCreated, map[string]any{
			"ok":         true,
			"youtubeUrl": req.URL,
		})
	}
}
