package music

import (
	"fmt"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

func ProcessQueue(ctx *context.Context) {
	store := context.GetQueueStore()
	if store == nil {
		logging.Error("Queue store unavailable for processing")
		return
	}

	go func() {
		queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)

		for {
			nextTrack, err := store.PopNext(queueKey)
			if err != nil {
				logging.Error("Failed to pop next track: " + err.Error())
				break
			}

			if nextTrack == nil {
				_ = store.SetPlaying(queueKey, false)
				_ = store.ClearNowPlaying(queueKey)

				context.NowPlayingMutex.Lock()
				delete(context.NowPlaying, queueKey)
				context.NowPlayingMutex.Unlock()

				context.NowPlayingInfoMutex.Lock()
				delete(context.NowPlayingInfo, queueKey)
				context.NowPlayingInfoMutex.Unlock()

				// Wait a moment before disconnecting to avoid rapid connect/disconnect cycles
				time.Sleep(500 * time.Millisecond)

				vc, vcErr := discord.GetVoiceConnection(ctx)
				if vcErr == nil {
					vc.Speaking(false)
					vc.Disconnect()
				}
				break
			}

			meta, metaErr := store.LookupMetadata(queueKey, nextTrack.URL)
			if metaErr == nil && meta != nil {
				nextTrack = meta
			}
			_ = store.SetNowPlaying(queueKey, nextTrack)

			context.NowPlayingMutex.Lock()
			context.NowPlaying[queueKey] = nextTrack.URL
			context.NowPlayingMutex.Unlock()

			context.NowPlayingInfoMutex.Lock()
			context.NowPlayingInfo[queueKey] = nextTrack
			context.NowPlayingInfoMutex.Unlock()

			pending, lengthErr := store.Length(queueKey)
			if lengthErr != nil {
				pending = 0
			}

			title := nextTrack.Title
			if title == "" {
				title = nextTrack.URL
			}

			logging.Info(fmt.Sprintf("Playing song, %d more in queue: %s", pending, queueKey))
			ctx.Reply(fmt.Sprintf("Now playing: %s", title))

			// Create a stop channel for this song
			context.StopMutex.Lock()
			stop := make(chan bool)
			context.StopChannels[queueKey] = stop
			context.StopMutex.Unlock()

			// Create pause channel
			context.PauseChMutex.Lock()
			pauseCh := make(chan bool, 1)
			context.PauseChs[queueKey] = pauseCh
			context.PauseChMutex.Unlock()

			// Initialize pause state
			context.PauseMutex.Lock()
			pauseCh <- context.Paused[queueKey]
			context.PauseMutex.Unlock()

			done := make(chan bool)
			go PlayAudio(ctx, nextTrack.URL, stop, pauseCh, done)
			<-done

			logging.Info("Song finished, moving to next in queue if available.")

			// Clean up pause channel
			context.PauseChMutex.Lock()
			delete(context.PauseChs, queueKey)
			context.PauseChMutex.Unlock()
		}
	}()
}
