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
		for {
		context.QueueMutex.Lock()
		if len(context.Queue[ctx.GetGuildID()]) == 0 {
			// If the queue is empty, mark the bot as idle and leave the voice channel.
			context.PlayingMutex.Lock()
			context.Playing[ctx.GetGuildID()] = false
			context.PlayingMutex.Unlock()
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
		currentURL := context.Queue[ctx.GetGuildID()][0]
		context.Queue[ctx.GetGuildID()] = context.Queue[ctx.GetGuildID()][1:]
		songLength := len(context.Queue[ctx.GetGuildID()])
		context.QueueMutex.Unlock()

			logging.Info("Playing song, " + strconv.Itoa(songLength) + " more in queue ")
			ctx.Reply(fmt.Sprintf("Now playing: %s", currentURL))

		// Create a stop channel for this song
		context.StopMutex.Lock()
		stop := make(chan bool)
		context.StopChannels[ctx.GetGuildID()] = stop
		context.StopMutex.Unlock()

		// Create pause channel
		context.PauseChMutex.Lock()
		pauseCh := make(chan bool, 1) // Buffered channel
		context.PauseChs[ctx.GetGuildID()] = pauseCh
		context.PauseChMutex.Unlock()

		// Initialize pause state
		context.PauseMutex.Lock()
		pauseCh <- context.Paused[ctx.GetGuildID()]
		context.PauseMutex.Unlock()

			done := make(chan bool)
			go PlayAudio(ctx, currentURL, stop, pauseCh, done)
			<-done

			logging.Info("Song finished, moving to next in queue if available.")

		// Clean up pause channel
		context.PauseChMutex.Lock()
		delete(context.PauseChs, ctx.GetGuildID())
		context.PauseChMutex.Unlock()
		}
	}()
}
