package music

import (
	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/shared/context"
)

func SkipSong(ctx *context.Context) {
	vc, err := discord.GetVoiceConnection(ctx)
	if err != nil {
		ctx.Reply("Not in a voice channel")
		return
	}

	// Signal the current song to stop
	context.StopMutex.Lock()
	if stopChan, exists := context.StopChannels[ctx.GetGuildID()]; exists {
		close(stopChan)
		delete(context.StopChannels, ctx.GetGuildID())
	}
	context.StopMutex.Unlock()

	vc.Speaking(false)

	ctx.Reply("Skipping current song")

	// The song will stop, and the queue processor will automatically move to the next song
	// We don't need to start a new queue processor
}
