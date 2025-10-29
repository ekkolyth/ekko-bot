package handlers

import (
    "net/http"
    "os"

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

var discordSessionProvider func() any // set via SetDiscordSession

func SetDiscordSession(session any) {
    // store as untyped to keep handler package decoupled; cast on use
    discordSessionProvider = func() any { return session }
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

        // Use Discord session directly in API
        if discordSessionProvider == nil {
            httpx.RespondError(write, http.StatusInternalServerError, "Discord session not initialized")
            return
        }

        s, _ := discordSessionProvider().(*discordgo.Session)
        if s == nil {
            httpx.RespondError(write, http.StatusInternalServerError, "Discord session unavailable")
            return
        }

        guildID := os.Getenv("DISCORD_GUILD_ID")
        if guildID == "" {
            // Derive guild from provided voice_channel_id when not configured via env
            ch, err := s.Channel(request.VoiceChannelID)
            if err != nil || ch == nil || ch.GuildID == "" {
                httpx.RespondError(write, http.StatusInternalServerError, "Unable to determine guild from voice_channel_id")
                return
            }
            guildID = ch.GuildID
        }

        // Build context and call AddSong directly
        ctx := &appctx.Context{
            SourceType:             appctx.SourceTypeWeb,
            Session:                s,
            GuildID:                guildID,
            VoiceChannelID:         request.VoiceChannelID,
            RequesterDiscordUserID: request.DiscordUserID,
            RequesterTag:           request.DiscordTag,
            Arguments:              map[string]string{"url": request.URL},
            ArgumentsRaw:           make(map[string]any),
        }

        logging.Info("API queue.add discord_user_id=" + request.DiscordUserID + " discord_tag=" + request.DiscordTag + " guild_id=" + guildID + " voice_channel_id=" + request.VoiceChannelID)

        discord.AddSong(ctx, false, request.URL)

        httpx.RespondJSON(write, http.StatusCreated, map[string]any{
            "ok":         true,
            "youtubeUrl": request.URL,
        })
    }
}
