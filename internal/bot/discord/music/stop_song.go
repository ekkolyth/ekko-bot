package music

import (
	"time"

	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"
)

func StopSong(ctx *state.Context) {
	// Get the voice connection for the guild
	vc, err := discord.GetVoiceConnection(ctx)
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

	// Clear the queue for the guild
	state.QueueMutex.Lock()
	state.Queue[ctx.GetGuildID()] = []string{}
	state.QueueMutex.Unlock()

	// Mark the bot as not playing
	state.PlayingMutex.Lock()
	state.Playing[ctx.GetGuildID()] = false
	state.PlayingMutex.Unlock()

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
