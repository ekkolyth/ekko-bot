package discord

import (
	"fmt"
	"strconv"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

func ProcessQueue(ctx *context.Context) {
	go func() {
		queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)
		
		for {
		context.QueueMutex.Lock()
		if len(context.Queue[queueKey]) == 0 {
			// If the queue is empty, mark the bot as idle and leave the voice channel.
			context.PlayingMutex.Lock()
			context.Playing[queueKey] = false
			context.PlayingMutex.Unlock()

			// Clear now playing
			context.NowPlayingMutex.Lock()
			delete(context.NowPlaying, queueKey)
			context.NowPlayingMutex.Unlock()

			// Clear now playing info
			context.NowPlayingInfoMutex.Lock()
			delete(context.NowPlayingInfo, queueKey)
			context.NowPlayingInfoMutex.Unlock()

			context.QueueMutex.Unlock()

				// Wait a moment before disconnecting to avoid rapid connect/disconnect cycles
				time.Sleep(500 * time.Millisecond)

				vc, err := GetVoiceConnection(ctx)
				if err == nil {
					vc.Speaking(false)
					vc.Disconnect()
				}
				break
			}

		// Dequeue the next song
		currentURL := context.Queue[queueKey][0]
		context.Queue[queueKey] = context.Queue[queueKey][1:]
		songLength := len(context.Queue[queueKey])
		context.QueueMutex.Unlock()

		// Store the currently playing track
		context.NowPlayingMutex.Lock()
		context.NowPlaying[queueKey] = currentURL
		context.NowPlayingMutex.Unlock()

		// Store metadata if available
		context.TrackMetadataCacheMutex.Lock()
		if meta, exists := context.TrackMetadataCache[queueKey][currentURL]; exists {
			context.NowPlayingInfoMutex.Lock()
			context.NowPlayingInfo[queueKey] = meta
			context.NowPlayingInfoMutex.Unlock()
		}
		context.TrackMetadataCacheMutex.Unlock()

			logging.Info("Playing song, " + strconv.Itoa(songLength) + " more in queue: " + queueKey)
			ctx.Reply(fmt.Sprintf("Now playing: %s", currentURL))

		// Create a stop channel for this song
		context.StopMutex.Lock()
		stop := make(chan bool)
		context.StopChannels[queueKey] = stop
		context.StopMutex.Unlock()

		// Create pause channel
		context.PauseChMutex.Lock()
		pauseCh := make(chan bool, 1) // Buffered channel
		context.PauseChs[queueKey] = pauseCh
		context.PauseChMutex.Unlock()

		// Initialize pause state
		context.PauseMutex.Lock()
		pauseCh <- context.Paused[queueKey]
		context.PauseMutex.Unlock()

			done := make(chan bool)
			go PlayAudio(ctx, currentURL, stop, pauseCh, done)
			<-done

			logging.Info("Song finished, moving to next in queue if available.")

		// Clean up pause channel
		context.PauseChMutex.Lock()
		delete(context.PauseChs, queueKey)
		context.PauseChMutex.Unlock()
		}
	}()
}
