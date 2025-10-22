package handlers

import (
	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/bot/discord/command"
	"github.com/ekkolyth/ekko-bot/internal/bot/discord/music"
	"github.com/ekkolyth/ekko-bot/internal/shared/context"
)

// Both handlers can use this to forward to the correct command
func commandSelector(ctx *context.Context) {
	if context.DisabledCommands[ctx.CommandName] {
		ctx.Reply("This command has been disabled.")
		return
	}

	switch ctx.CommandName {
	case "ping":
		command.Ping(ctx)
	case "pong":
		command.Ping(ctx)
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
		command.NukeMessages(ctx)
	case "uptime":
		httpx.Uptime(ctx)
	case "version":
		httpx.Version(ctx)
	case "help":
		command.Help(ctx)
	default:
		command.Unknown(ctx)
	}
}
