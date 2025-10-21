package music

import (
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/bot/audio"
	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/shared/context"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/validation"
)

func AddSong(ctx *context.Context, search_mode bool) { // mode (false for play, true for search)
	var url string

	if !discord.IsUserInVoiceChannel(ctx) {
		ctx.Reply("You must be in a voice channel to use this command.")
		return
	}

	if search_mode {
		if ctx.SourceType == context.SourceTypeInteraction {
			// To avoid the discord timeout for interactions
			ctx.Reply("Searching...")
		}

		var hadToSanitise bool

		searchQuery := strings.TrimSpace(ctx.Arguments["query"])

		if !validation.IsValidSearchQuery(searchQuery) {
			var searchQuerySafeToUse bool
			searchQuery, searchQuerySafeToUse = validation.SanitiseSearchQuery(searchQuery)
			hadToSanitise = true
			if !searchQuerySafeToUse {
				ctx.Reply("Invalid search query")
				return
			}
		}

		var found_result bool
		url, found_result = audio.SearchYoutube(searchQuery)

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

		if !validation.IsValidURL(url) {
			ctx.Reply("Invalid URL")
			return
		}

	}
	context.QueueMutex.Lock()
	context.Queue[ctx.GetGuildID()] = append(context.Queue[ctx.GetGuildID()], url)
	context.QueueMutex.Unlock()

	context.PlayingMutex.Lock()
	isAlreadyPlaying := context.Playing[ctx.GetGuildID()]
	context.PlayingMutex.Unlock()

	ctx.Reply("Added to queue.")

	if !isAlreadyPlaying {
		// Start processing the queue if the bot is idle
		context.PlayingMutex.Lock()
		context.Playing[ctx.GetGuildID()] = true
		context.PlayingMutex.Unlock()
		audio.ProcessQueue(ctx)
	}
}
