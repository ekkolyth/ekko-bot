package music

import (
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
)

func PauseSong(ctx *context.Context) {
	if !discord.BotInChannel(ctx) {
		ctx.Reply("Not in a voice channel.")
		return
	}

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

	context.PauseMutex.Lock()
	currentState := context.Paused[queueKey]
	newState := !currentState
	context.Paused[queueKey] = newState
	context.PauseMutex.Unlock()

	_ = store.SetPaused(queueKey, newState)

	context.PauseChMutex.Lock()
	if ch, exists := context.PauseChs[queueKey]; exists {
		select {
		case ch <- newState:
		default:
		}
	}
	context.PauseChMutex.Unlock()

	if currentState {
		ctx.Reply("Resumed playback.")
	} else {
		ctx.Reply("Paused playback.")
	}
}
