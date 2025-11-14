package discord

import (
	"time"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

func StopSong(ctx *context.Context) {
	// Get the voice connection for the guild
	vc, err := GetVoiceConnection(ctx)
	if err != nil {
		ctx.Reply("Not in a voice channel")
		return
	}

	if !ensureVoiceChannelID(ctx) {
		ctx.Reply("Could not determine your voice channel.")
		return
	}

	// Notify the user first (before goroutine that might affect context)
	ctx.Reply("Stopped playback and cleared the queue.")

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)
	store := context.GetQueueStore()
	if store == nil {
		ctx.Reply("Queue store unavailable.")
		return
	}

	// Signal the current song to stop
	context.StopMutex.Lock()
	if stopChan, exists := context.StopChannels[queueKey]; exists {
		close(stopChan)
		delete(context.StopChannels, queueKey)
	}
	context.StopMutex.Unlock()

	// Clear the queue for the guild
	if err := store.Clear(queueKey); err != nil {
		logging.Error("Failed to clear queue: " + err.Error())
	}

	// Clear now playing
	context.NowPlayingMutex.Lock()
	delete(context.NowPlaying, queueKey)
	context.NowPlayingMutex.Unlock()
	_ = store.ClearNowPlaying(queueKey)

	// Clear now playing info
	context.NowPlayingInfoMutex.Lock()
	delete(context.NowPlayingInfo, queueKey)
	context.NowPlayingInfoMutex.Unlock()

	// Clear metadata cache for this queue
	if err := store.ClearMetadata(queueKey); err != nil {
		logging.Error("Failed to clear metadata cache: " + err.Error())
	}

	context.PauseMutex.Lock()
	delete(context.Paused, queueKey)
	context.PauseMutex.Unlock()
	_ = store.SetPaused(queueKey, false)

	// Mark the bot as not playing
	if err := store.SetPlaying(queueKey, false); err != nil {
		logging.Error("Failed to update playing state: " + err.Error())
	}

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
}
