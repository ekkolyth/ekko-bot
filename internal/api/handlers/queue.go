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

// getGuildID reads and validates DISCORD_GUILD_ID from environment
// Returns the guild ID and an error message if validation fails (empty string = no error)
func getGuildID() (string, string) {
	guildID := os.Getenv("DISCORD_GUILD_ID")
	if guildID == "" {
		return "", "Missing DISCORD_GUILD_ID environment variable"
	}

	if !httpx.ValidDiscordSnowflake(guildID) {
		return "", "Invalid DISCORD_GUILD_ID: must be a valid Discord snowflake (numeric, not \"_\")"
	}

	return guildID, ""
}

type queueAdd struct {
	DiscordUserID  string `json:"discord_user_id"`
	DiscordTag     string `json:"discord_tag"`
	VoiceChannelID string `json:"voice_channel_id"`
	URL            string `json:"url"`
}

type queueTrack struct {
	Position  int    `json:"position"`
	URL       string `json:"url"`
	Title     string `json:"title"`
	Artist    string `json:"artist"`
	Duration  int    `json:"duration"`
	Thumbnail string `json:"thumbnail"`
	AddedBy   string `json:"added_by"`
	AddedByID string `json:"added_by_id"`
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
		voiceChannelID := read.URL.Query().Get("voice_channel_id")
		if voiceChannelID == "" {
			httpx.RespondError(write, http.StatusBadRequest, "Missing voice_channel_id query parameter")
			return
		}

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		store := appctx.GetQueueStore()
		if store == nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Queue store unavailable")
			return
		}

		queueKey := appctx.QueueKey(guildID, voiceChannelID)
		isPlaying, err := store.IsPlaying(queueKey)
		if err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to read queue state")
			return
		}
		isPaused, err := store.IsPaused(queueKey)
		if err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to read pause state")
			return
		}

		volume, err := store.GetVolume(queueKey)
		if err != nil {
			volume = 1.0
		}

		nowPlayingInfo, err := store.GetNowPlaying(queueKey)
		if err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to read now playing info")
			return
		}

		queueEntries, err := store.Snapshot(queueKey)
		if err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to load queue")
			return
		}

		metadataCache := make(map[string]*appctx.TrackInfo)
		getMetadata := func(url string) *appctx.TrackInfo {
			if cached, exists := metadataCache[url]; exists {
				return cached
			}
			meta, metaErr := store.LookupMetadata(queueKey, url)
			if metaErr != nil {
				metadataCache[url] = nil
				return nil
			}
			metadataCache[url] = meta
			return meta
		}

		var tracks []queueTrack
		position := 0

		if nowPlayingInfo != nil {
			meta := getMetadata(nowPlayingInfo.URL)
			tracks = append(tracks, queueTrackFromInfo(position, nowPlayingInfo, meta))
			position++
		}

		for _, entry := range queueEntries {
			meta := getMetadata(entry.URL)
			tracks = append(tracks, queueTrackFromInfo(position, entry, meta))
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

func queueTrackFromInfo(position int, info *appctx.TrackInfo, meta *appctx.TrackInfo) queueTrack {
	if info == nil {
		info = &appctx.TrackInfo{}
	}

	track := queueTrack{
		Position:  position,
		URL:       info.URL,
		Title:     info.URL,
		Artist:    "",
		Duration:  0,
		Thumbnail: "",
		AddedBy:   info.AddedBy,
		AddedByID: info.AddedByID,
	}

	if info.Title != "" {
		track.Title = info.Title
	}
	if info.Artist != "" {
		track.Artist = info.Artist
	}
	if info.Duration != 0 {
		track.Duration = info.Duration
	}
	if info.Thumbnail != "" {
		track.Thumbnail = info.Thumbnail
	}

	if meta != nil {
		if track.URL == "" && meta.URL != "" {
			track.URL = meta.URL
		}
		if meta.Title != "" {
			track.Title = meta.Title
		}
		if meta.Artist != "" {
			track.Artist = meta.Artist
		}
		if meta.Duration != 0 {
			track.Duration = meta.Duration
		}
		if meta.Thumbnail != "" {
			track.Thumbnail = meta.Thumbnail
		}
		if meta.AddedBy != "" {
			track.AddedBy = meta.AddedBy
		}
		if meta.AddedByID != "" {
			track.AddedByID = meta.AddedByID
		}
	}

	if track.AddedBy == "" {
		track.AddedBy = "Unknown"
	}

	return track
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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
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

		logging.Api("queue.add user:" + request.DiscordTag + request.DiscordUserID + " discord_tag=")

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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		store := appctx.GetQueueStore()
		if store == nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Queue store unavailable")
			return
		}

		queueKey := appctx.QueueKey(guildID, request.VoiceChannelID)

		nowPlaying, err := store.GetNowPlaying(queueKey)
		if err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to read now playing state")
			return
		}

		if request.Position == 0 && nowPlaying != nil {
			httpx.RespondError(write, http.StatusBadRequest, "Cannot remove currently playing track. Use skip instead.")
			return
		}

		queuePosition := request.Position
		if nowPlaying != nil {
			queuePosition = request.Position - 1
		}

		if queuePosition < 0 {
			httpx.RespondError(write, http.StatusBadRequest, "Invalid position")
			return
		}

		if err := store.Remove(queueKey, queuePosition); err != nil {
			httpx.RespondError(write, http.StatusBadRequest, "Failed to remove track")
			return
		}

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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		store := appctx.GetQueueStore()
		if store == nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Queue store unavailable")
			return
		}

		queueKey := appctx.QueueKey(guildID, request.VoiceChannelID)
		if err := store.Clear(queueKey); err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to clear queue")
			return
		}
		if err := store.ClearMetadata(queueKey); err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to clear metadata")
			return
		}
		if err := store.ClearNowPlaying(queueKey); err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to reset now playing")
			return
		}
		_ = store.SetPlaying(queueKey, false)

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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
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

func QueueStop() http.HandlerFunc {
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

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		type stopRequest struct {
			VoiceChannelID string `json:"voice_channel_id"`
		}

		var req stopRequest
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

		discord.StopSong(ctx)

		httpx.RespondJSON(write, http.StatusOK, map[string]any{"ok": true})
	}
}
