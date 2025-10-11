package commands

import (
	"github.com/ekkolyth/ekko-bot/internal/bot/discordutil"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"
)

func SkipSong(ctx *state.Context) {
	vc, err := discordutil.GetVoiceConnection(ctx)
	if err != nil {
		ctx.Reply("Not in a voice channel")
		return
	}

	// Signal the current song to stop
	state.StopMutex.Lock()
	if stopChan, exists := state.StopChannels[ctx.GetGuildID()]; exists {
		close(stopChan)
		delete(state.StopChannels, ctx.GetGuildID())
	}
	state.StopMutex.Unlock()

	vc.Speaking(false)

	ctx.Reply("Skipping current song")

	// The song will stop, and the queue processor will automatically move to the next song
	// We don't need to start a new queue processor
}
