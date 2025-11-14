package discord

import (
	"github.com/ekkolyth/ekko-bot/internal/context"
)

func SkipSong(ctx *context.Context) {
	vc, err := GetVoiceConnection(ctx)
	if err != nil {
		ctx.Reply("Not in a voice channel")
		return
	}

	if !ensureVoiceChannelID(ctx) {
		ctx.Reply("Could not determine your voice channel.")
		return
	}

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)

	// Signal the current song to stop
	context.StopMutex.Lock()
	if stopChan, exists := context.StopChannels[queueKey]; exists {
		close(stopChan)
		delete(context.StopChannels, queueKey)
	}
	context.StopMutex.Unlock()

	vc.Speaking(false)

	ctx.Reply("Skipping current song")

	// The song will stop, and the queue processor will automatically move to the next song
	// We don't need to start a new queue processor
}
