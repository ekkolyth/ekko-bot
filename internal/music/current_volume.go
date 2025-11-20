package music

import (
	"fmt"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
)

func CurrentVolume(ctx *context.Context) {
	if !discord.EnsureVoiceChannelID(ctx) {
		ctx.Reply("Could not determine your voice channel.")
		return
	}

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)
	store := context.GetQueueStore()
	if store == nil {
		ctx.Reply("Queue store unavailable.")
		return
	}

	context.VolumeMutex.Lock()
	currentVolume, ok := context.Volume[queueKey]
	context.VolumeMutex.Unlock()

	if !ok {
		value, err := store.GetVolume(queueKey)
		if err != nil {
			value = 1.0
		}
		context.VolumeMutex.Lock()
		context.Volume[queueKey] = value
		context.VolumeMutex.Unlock()
		currentVolume = value
	}

	currentVolume = currentVolume * 100.0
	ctx.Reply(fmt.Sprintf("Current volume is %.1f%%", currentVolume))
}
