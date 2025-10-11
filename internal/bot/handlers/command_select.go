package handlers

import (
	"github.com/ekkolyth/ekko-bot/internal/bot/discord/core"
	"github.com/ekkolyth/ekko-bot/internal/bot/discord/message"
	"github.com/ekkolyth/ekko-bot/internal/bot/discord/music"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"
)

// Both handlers can use this to forward to the correct command
func commandSelector(ctx *state.Context) {
	if state.DisabledCommands[ctx.CommandName] {
		ctx.Reply("This command has been disabled.")
		return
	}

	switch ctx.CommandName {
	case "ping":
		message.Pong(ctx)
	case "pong":
		message.Ping(ctx)
	case "play":
		music.AddSong(ctx, false) // false as in not a search
	case "search":
		music.AddSong(ctx, true) // true as in search for a song
	case "skip":
		music.SkipSong(ctx)
	case "queue":
		music.ShowQueue(ctx)
	case "stop":
		music.StopSong(ctx)
	case "pause", "resume":
		music.PauseSong(ctx)
	case "volume":
		music.SetVolume(ctx)
	case "currentvolume":
		music.CurrentVolume(ctx)
	case "nuke": // delete n messages
		message.NukeMessages(ctx)
	case "uptime":
		core.Uptime(ctx)
	case "version":
		core.Version(ctx)
	case "help":
		core.Help(ctx)
	default:
		core.Unknown(ctx)
	}
}
