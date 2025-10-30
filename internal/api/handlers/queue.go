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

type queueTrack struct {
	Position    int     `json:"position"`
	URL         string  `json:"url"`
	Title       string  `json:"title"`
	Artist      string  `json:"artist"`
	Duration    int     `json:"duration"`
	Thumbnail   string  `json:"thumbnail"`
	AddedBy     string  `json:"added_by"`
	AddedByID   string  `json:"added_by_id"`
}

type queueResponse struct {
	VoiceChannelID string       `json:"voice_channel_id"`
	Tracks         []queueTrack `json:"tracks"`
	IsPlaying      bool         `json:"is_playing"`
	IsPaused       bool         `json:"is_paused"`
	Volume         float64      `json:"volume"`
}

var discordSessionProvider func() any // set via SetDiscordSession

func SetDiscordSession(session any) {
    // store as untyped to keep handler package decoupled; cast on use
    discordSessionProvider = func() any { return session }
}

func QueueGet() http.HandlerFunc {
    return func(write http.ResponseWriter, read *http.Request) {
        // Get voice_channel_id from query params
        voiceChannelID := read.URL.Query().Get("voice_channel_id")
        if voiceChannelID == "" {
            httpx.RespondError(write, http.StatusBadRequest, "Missing voice_channel_id query parameter")
            return
        }

        guildID := os.Getenv("DISCORD_GUILD_ID")
        if guildID == "" {
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
        }

        // Create queue key for this guild+voice channel
        queueKey := appctx.QueueKey(guildID, voiceChannelID)

        // Lock and read queue state
        appctx.NowPlayingMutex.Lock()
        nowPlayingURL := appctx.NowPlaying[queueKey]
        appctx.NowPlayingMutex.Unlock()

        appctx.QueueMutex.Lock()
        queueURLs := appctx.Queue[queueKey]
        appctx.QueueMutex.Unlock()

        appctx.PlayingMutex.Lock()
        isPlaying := appctx.Playing[queueKey]
        appctx.PlayingMutex.Unlock()

        appctx.PauseMutex.Lock()
        isPaused := appctx.Paused[queueKey]
        appctx.PauseMutex.Unlock()

        appctx.VolumeMutex.Lock()
        volume := appctx.Volume[queueKey]
        appctx.VolumeMutex.Unlock()

        // Get metadata cache for this queue
        appctx.TrackMetadataCacheMutex.Lock()
        metadataCache := appctx.TrackMetadataCache[queueKey]
        appctx.TrackMetadataCacheMutex.Unlock()

        // Get now playing info
        appctx.NowPlayingInfoMutex.Lock()
        nowPlayingInfo := appctx.NowPlayingInfo[queueKey]
        appctx.NowPlayingInfoMutex.Unlock()

        // Convert to tracks - include now playing as position 0 if it exists
        tracks := make([]queueTrack, 0)
        position := 0
        
        // Add currently playing track first
        if nowPlayingURL != "" {
            track := queueTrack{
                Position:  position,
                URL:       nowPlayingURL,
                Title:     nowPlayingURL,
                Artist:    "",
                Duration:  0,
                Thumbnail: "",
                AddedBy:   "Unknown",
                AddedByID: "",
            }

            // Use cached metadata if available
            if nowPlayingInfo != nil {
                track.Title = nowPlayingInfo.Title
                track.Artist = nowPlayingInfo.Artist
                track.Duration = nowPlayingInfo.Duration
                track.Thumbnail = nowPlayingInfo.Thumbnail
                track.AddedBy = nowPlayingInfo.AddedBy
                track.AddedByID = nowPlayingInfo.AddedByID
            } else if metadataCache != nil {
                if meta, exists := metadataCache[nowPlayingURL]; exists {
                    track.Title = meta.Title
                    track.Artist = meta.Artist
                    track.Duration = meta.Duration
                    track.Thumbnail = meta.Thumbnail
                    track.AddedBy = meta.AddedBy
                    track.AddedByID = meta.AddedByID
                }
            }

            tracks = append(tracks, track)
            position++
        }
        
        // Add queued tracks
        for _, url := range queueURLs {
            track := queueTrack{
                Position:  position,
                URL:       url,
                Title:     url,
                Artist:    "",
                Duration:  0,
                Thumbnail: "",
                AddedBy:   "Unknown",
                AddedByID: "",
            }

            // Use cached metadata if available
            if metadataCache != nil {
                if meta, exists := metadataCache[url]; exists {
                    track.Title = meta.Title
                    track.Artist = meta.Artist
                    track.Duration = meta.Duration
                    track.Thumbnail = meta.Thumbnail
                    track.AddedBy = meta.AddedBy
                    track.AddedByID = meta.AddedByID
                }
            }

            tracks = append(tracks, track)
            position++
        }

        response := queueResponse{
            VoiceChannelID: voiceChannelID,
            Tracks:         tracks,
            IsPlaying:      isPlaying,
            IsPaused:       isPaused,
            Volume:         volume,
        }

        httpx.RespondJSON(write, http.StatusOK, response)
    }
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
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
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

func QueueRemove() http.HandlerFunc {
    return func(write http.ResponseWriter, read *http.Request) {
        type removeRequest struct {
            VoiceChannelID string `json:"voice_channel_id"`
            Position       int    `json:"position"`
        }

        var request removeRequest
        if err := httpx.DecodeJSON(write, read, &request, 1<<20); err != nil {
            httpx.RespondError(write, http.StatusBadRequest, err.Error())
            return
        }

        guildID := os.Getenv("DISCORD_GUILD_ID")
        if guildID == "" {
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
        }

        // Create queue key
        queueKey := appctx.QueueKey(guildID, request.VoiceChannelID)

        // Check if there's a currently playing track
        appctx.NowPlayingMutex.Lock()
        hasNowPlaying := appctx.NowPlaying[queueKey] != ""
        appctx.NowPlayingMutex.Unlock()

        // If position 0 and there's something playing, that's the current track - can't remove it
        if request.Position == 0 && hasNowPlaying {
            httpx.RespondError(write, http.StatusBadRequest, "Cannot remove currently playing track. Use skip instead.")
            return
        }

        appctx.QueueMutex.Lock()
        defer appctx.QueueMutex.Unlock()

        queue := appctx.Queue[queueKey]
        
        // Adjust position: if there's a now playing track, frontend position 0 is that track,
        // so frontend position N maps to queue position N-1
        queuePosition := request.Position
        if hasNowPlaying {
            queuePosition = request.Position - 1
        }

        if queuePosition < 0 || queuePosition >= len(queue) {
            httpx.RespondError(write, http.StatusBadRequest, "Invalid position")
            return
        }

        // Remove the item at position
        appctx.Queue[queueKey] = append(queue[:queuePosition], queue[queuePosition+1:]...)

        httpx.RespondJSON(write, http.StatusOK, map[string]any{"ok": true})
    }
}

func QueueClear() http.HandlerFunc {
    return func(write http.ResponseWriter, read *http.Request) {
        type clearRequest struct {
            VoiceChannelID string `json:"voice_channel_id"`
        }

        var request clearRequest
        if err := httpx.DecodeJSON(write, read, &request, 1<<20); err != nil {
            httpx.RespondError(write, http.StatusBadRequest, err.Error())
            return
        }

        guildID := os.Getenv("DISCORD_GUILD_ID")
        if guildID == "" {
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
        }

        queueKey := appctx.QueueKey(guildID, request.VoiceChannelID)

        appctx.QueueMutex.Lock()
        appctx.Queue[queueKey] = []string{}
        appctx.QueueMutex.Unlock()

        httpx.RespondJSON(write, http.StatusOK, map[string]any{"ok": true})
    }
}

func QueuePause() http.HandlerFunc {
    return func(write http.ResponseWriter, read *http.Request) {
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
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
        }

        // Get voice channel ID from request body
        type pauseRequest struct {
            VoiceChannelID string `json:"voice_channel_id"`
        }
        var req pauseRequest
        if err := httpx.DecodeJSON(write, read, &req, 1<<20); err != nil {
            httpx.RespondError(write, http.StatusBadRequest, err.Error())
            return
        }

        ctx := &appctx.Context{
            SourceType:     appctx.SourceTypeWeb,
            Session:        s,
            GuildID:        guildID,
            VoiceChannelID: req.VoiceChannelID,
        }

        discord.PauseSong(ctx)

        httpx.RespondJSON(write, http.StatusOK, map[string]any{"ok": true})
    }
}

func QueuePlay() http.HandlerFunc {
    return func(write http.ResponseWriter, read *http.Request) {
        type playRequest struct {
            VoiceChannelID string `json:"voice_channel_id"`
        }

        var request playRequest
        if err := httpx.DecodeJSON(write, read, &request, 1<<20); err != nil {
            httpx.RespondError(write, http.StatusBadRequest, err.Error())
            return
        }

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
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
        }

        ctx := &appctx.Context{
            SourceType:     appctx.SourceTypeWeb,
            Session:        s,
            GuildID:        guildID,
            VoiceChannelID: request.VoiceChannelID,
        }

        queueKey := appctx.QueueKey(guildID, request.VoiceChannelID)

        // Check if paused, if so unpause
        appctx.PauseMutex.Lock()
        isPaused := appctx.Paused[queueKey]
        appctx.PauseMutex.Unlock()

        if isPaused {
            discord.PauseSong(ctx) // Toggle pause off
        } else {
            // Start playing if not already
            discord.ProcessQueue(ctx)
        }

        httpx.RespondJSON(write, http.StatusOK, map[string]any{"ok": true})
    }
}

func QueueSkip() http.HandlerFunc {
    return func(write http.ResponseWriter, read *http.Request) {
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
            httpx.RespondError(write, http.StatusInternalServerError, "Missing DISCORD_GUILD_ID")
            return
        }

        // Get voice channel ID from request body
        type skipRequest struct {
            VoiceChannelID string `json:"voice_channel_id"`
        }
        var req skipRequest
        if err := httpx.DecodeJSON(write, read, &req, 1<<20); err != nil {
            httpx.RespondError(write, http.StatusBadRequest, err.Error())
            return
        }

        ctx := &appctx.Context{
            SourceType:     appctx.SourceTypeWeb,
            Session:        s,
            GuildID:        guildID,
            VoiceChannelID: req.VoiceChannelID,
        }

        discord.SkipSong(ctx)

        httpx.RespondJSON(write, http.StatusOK, map[string]any{"ok": true})
    }
}
