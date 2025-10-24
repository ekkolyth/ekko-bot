package handlers

import (
	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
)

// Both handlers can use this to forward to the correct command
func commandSelector(ctx *context.Context) {
	if context.DisabledCommands[ctx.CommandName] {
		ctx.Reply("This command has been disabled.")
		return
	}

	switch ctx.CommandName {
	case "ping":
		discord.Ping(ctx)
	case "pong":
		discord.Ping(ctx)
	case "play":
		discord.AddSong(ctx, false) // false as in not a search
	case "search":
		discord.AddSong(ctx, true) // true as in search for a song
	case "skip":
		discord.SkipSong(ctx)
	case "queue":
		discord.ShowQueue(ctx)
	case "stop":
		discord.StopSong(ctx)
	case "pause", "resume":
		discord.PauseSong(ctx)
	case "volume":
		discord.SetVolume(ctx)
	case "currentvolume":
		discord.CurrentVolume(ctx)
	case "nuke": // delete n messages
		discord.NukeMessages(ctx)
	case "uptime":
		httpx.Uptime(ctx)
	case "version":
		httpx.Version(ctx)
	case "help":
		discord.Help(ctx)
	default:
		discord.Unknown(ctx)
	}
}
