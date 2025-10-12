package music

import (
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/bot/audio"
	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"
	"github.com/ekkolyth/ekko-bot/internal/shared/validation"
)

func AddSong(ctx *state.Context, search_mode bool) { // mode (false for play, true for search)
	var url string

	if !discord.IsUserInVoiceChannel(ctx) {
		ctx.Reply("You must be in a voice channel to use this command.")
		return
	}

	if search_mode {
		if ctx.SourceType == state.SourceTypeInteraction {
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
	state.QueueMutex.Lock()
	state.Queue[ctx.GetGuildID()] = append(state.Queue[ctx.GetGuildID()], url)
	state.QueueMutex.Unlock()

	state.PlayingMutex.Lock()
	isAlreadyPlaying := state.Playing[ctx.GetGuildID()]
	state.PlayingMutex.Unlock()

	ctx.Reply("Added to queue.")

	if !isAlreadyPlaying {
		// Start processing the queue if the bot is idle
		state.PlayingMutex.Lock()
		state.Playing[ctx.GetGuildID()] = true
		state.PlayingMutex.Unlock()
		audio.ProcessQueue(ctx)
	}
}
