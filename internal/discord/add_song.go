package discord

import (
	stdcontext "context"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"
	"github.com/ekkolyth/ekko-bot/internal/media"
	"github.com/ekkolyth/ekko-bot/internal/recentlyplayed"
)

func AddSong(ctx *context.Context, search_mode bool, apiURL ...string) { // search_mode - false for play, true for search
	var url string
	var guildID string
	var isAPICall bool

	store := context.GetQueueStore()
	if store == nil {
		ctx.Reply("Queue store unavailable")
		return
	}

	// Determine if this is an API call or Discord command
	if len(apiURL) > 0 {
		// API call - use provided URL
		isAPICall = true
		url = strings.TrimSpace(apiURL[0])

		// For API calls, we need to get guildID from the Discord bot token
		// For now, we'll use a hardcoded guildID or get it from context if available
		if ctx != nil {
			guildID = ctx.GetGuildID()
		}

		// If no guildID from context, we need to handle this differently
		// For now, we'll use a default or require it to be passed
		if guildID == "" {
			// TODO: Implement proper guild management for API calls
			// For now, we'll use a hardcoded guildID or get it from environment
			guildID = "320162956706971648" // This should be replaced with proper guild management
			logging.Info("Using default guild ID for API call: " + guildID)
		}
	} else {
		// Discord command - get URL from context
		isAPICall = false
		guildID = ctx.GetGuildID()

		// Check voice channel only for Discord commands
		if !IsUserInVoiceChannel(ctx) {
			ctx.Reply("You must be in a voice channel to use this command.")
			return
		}
	}

	if search_mode {
		if ctx.SourceType == context.SourceTypeInteraction {
			// To avoid the discord timeout for interactions
			ctx.Reply("Searching...")
		}

		var hadToSanitise bool

		searchQuery := strings.TrimSpace(ctx.Arguments["query"])

		if !httpx.IsValidSearchQuery(searchQuery) {
			var searchQuerySafeToUse bool
			searchQuery, searchQuerySafeToUse = httpx.SanitiseSearchQuery(searchQuery)
			hadToSanitise = true
			if !searchQuerySafeToUse {
				ctx.Reply("Invalid search query")
				return
			}
		}

		var found_result bool
		url, found_result = media.SearchYoutube(searchQuery)

		if !found_result {
			logging.Error("No results found for: " + searchQuery)
			ctx.Reply("No results found for: " + searchQuery)
			return
		}

		if hadToSanitise {
			ctx.Reply("Found: " + url + " using: " + searchQuery)
		} else {
			ctx.Reply("Found: " + url)
		}
	} else {
		if len(ctx.Arguments["url"]) < 6 {
			ctx.Reply("Invalid URL")
			return
		}

		url = strings.TrimSpace(ctx.Arguments["url"])

		if !httpx.IsValidURL(url) {
			ctx.Reply("Invalid URL")
			return
		}

	}

	queueKey := context.QueueKey(guildID, ctx.VoiceChannelID)

	// Fetch video metadata and persist recently played entry in background
	go func(requesterTag, requesterID, guild, voiceChannel string) {
		meta := &context.TrackInfo{
			URL:       url,
			Title:     url,
			Artist:    "",
			Duration:  0,
			Thumbnail: "",
			AddedBy:   requesterTag,
			AddedByID: requesterID,
		}

		videoInfo, err := media.GetVideoInfo(url)
		if err == nil && videoInfo != nil {
			meta.Title = videoInfo.Title
			meta.Artist = videoInfo.Artist
			meta.Duration = videoInfo.Duration
			meta.Thumbnail = videoInfo.Thumbnail

			if saveErr := store.SaveMetadata(queueKey, url, meta); saveErr != nil {
				logging.Error("Failed to cache metadata: " + saveErr.Error())
			} else {
				logging.Info("Cached metadata for: " + videoInfo.Title)
			}
		}

		if recordErr := recentlyplayed.Record(stdcontext.Background(), recentlyplayed.RecordParams{
			GuildID:         guild,
			VoiceChannelID:  voiceChannel,
			URL:             url,
			Title:           meta.Title,
			Artist:          meta.Artist,
			DurationSeconds: meta.Duration,
			Thumbnail:       meta.Thumbnail,
			AddedBy:         meta.AddedBy,
			AddedByID:       meta.AddedByID,
		}); recordErr != nil {
			logging.Error("Failed to record recently played: " + recordErr.Error())
		}
	}(ctx.RequesterTag, ctx.RequesterDiscordUserID, guildID, ctx.VoiceChannelID)

	queueTrack := &context.TrackInfo{
		URL:       url,
		Title:     url,
		Artist:    "",
		Duration:  0,
		Thumbnail: "",
		AddedBy:   ctx.RequesterTag,
		AddedByID: ctx.RequesterDiscordUserID,
	}

	if err := store.Append(queueKey, queueTrack); err != nil {
		logging.Error("Failed to enqueue track: " + err.Error())
		ctx.Reply("Failed to add song to queue.")
		return
	}

	isAlreadyPlaying, err := store.IsPlaying(queueKey)
	if err != nil {
		logging.Error("Failed to read queue state: " + err.Error())
		ctx.Reply("Unable to read queue state.")
		return
	}

	if !isAPICall {
		ctx.Reply("Added to queue.")
	} else {
		logging.Info("Added to queue via API: " + url)
	}

	if !isAlreadyPlaying {
		_ = store.SetPlaying(queueKey, true)
		logging.Info("Starting queue processing for queue: " + queueKey)
		ProcessQueue(ctx)
	} else {
		logging.Info("Bot already playing in this channel, just added to queue: " + queueKey)
	}
}
