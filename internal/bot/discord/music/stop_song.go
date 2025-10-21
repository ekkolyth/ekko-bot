package music

import (
	"time"

	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/shared/context"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
)

func StopSong(ctx *context.Context) {
	// Get the voice connection for the guild
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

	// Clear the queue for the guild
	context.QueueMutex.Lock()
	context.Queue[ctx.GetGuildID()] = []string{}
	context.QueueMutex.Unlock()

	// Mark the bot as not playing
	context.PlayingMutex.Lock()
	context.Playing[ctx.GetGuildID()] = false
	context.PlayingMutex.Unlock()

	// Wait a moment for processes to terminate cleanly
	// then disconnect from the voice channel
	go func() {
		// Give a small delay for processes to clean up
		time.Sleep(500 * time.Millisecond)
		vc.Speaking(false)
		err = vc.Disconnect()
		if err != nil {
			logging.Error("Error disconnecting from voice channel: " + err.Error())
		}
	}()

	// Notify the user
	ctx.Reply("Stopped playback and cleared the queue.")
}
