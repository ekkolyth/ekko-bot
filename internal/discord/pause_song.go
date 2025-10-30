package discord

import (
	"github.com/ekkolyth/ekko-bot/internal/context"
)

func PauseSong(ctx *context.Context) {
	// Regardless of pause or resume, flip the state

	// Check if the bot is in a voice channel
	if !BotInChannel(ctx) {
		ctx.Reply("Not in a voice channel.")
		return
	}

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)

	context.PauseMutex.Lock()
	currentState := context.Paused[queueKey]
	context.Paused[queueKey] = !currentState // Toggle pause state
	context.PauseMutex.Unlock()

	// Signal the pause channel with the new state
	context.PauseChMutex.Lock()
	if ch, exists := context.PauseChs[queueKey]; exists {
		select {
		case ch <- !currentState: // Send the new state
		default: // Channel is full, discard
			// This prevents blocking if the channel is full
		}
	}
	context.PauseChMutex.Unlock()

	if currentState {
		ctx.Reply("Resumed playback.")
	} else {
		ctx.Reply("Paused playback.")
	}
}
