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

	// Notify the user first (before goroutine that might affect context)
	ctx.Reply("Stopped playback and cleared the queue.")

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)

	// Signal the current song to stop
	context.StopMutex.Lock()
	if stopChan, exists := context.StopChannels[queueKey]; exists {
		close(stopChan)
		delete(context.StopChannels, queueKey)
	}
	context.StopMutex.Unlock()

	// Clear the queue for the guild
	context.QueueMutex.Lock()
	context.Queue[queueKey] = []string{}
	context.QueueMutex.Unlock()

	// Clear now playing
	context.NowPlayingMutex.Lock()
	delete(context.NowPlaying, queueKey)
	context.NowPlayingMutex.Unlock()

	// Clear now playing info
	context.NowPlayingInfoMutex.Lock()
	delete(context.NowPlayingInfo, queueKey)
	context.NowPlayingInfoMutex.Unlock()

	// Clear metadata cache for this queue
	context.TrackMetadataCacheMutex.Lock()
	delete(context.TrackMetadataCache, queueKey)
	context.TrackMetadataCacheMutex.Unlock()

	// Mark the bot as not playing
	context.PlayingMutex.Lock()
	context.Playing[queueKey] = false
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
}
