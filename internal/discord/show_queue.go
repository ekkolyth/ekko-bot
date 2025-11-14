package discord

import (
	"fmt"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/context"
)

func ShowQueue(ctx *context.Context) {
	if !ensureVoiceChannelID(ctx) {
		ctx.Reply("Could not determine your voice channel.")
		return
	}

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)
	store := context.GetQueueStore()
	if store == nil {
		ctx.Reply("Queue store unavailable.")
		return
	}

	tracks, err := store.Snapshot(queueKey)
	if err != nil {
		ctx.Reply("Failed to load queue.")
		return
	}

	if len(tracks) == 0 {
		ctx.Reply("Queue is empty.")
		return
	}

	var formattedQueue []string
	for i, track := range tracks {
		display := track.Title
		if display == "" || display == track.URL {
			meta, metaErr := store.LookupMetadata(queueKey, track.URL)
			if metaErr == nil && meta != nil && meta.Title != "" {
				display = meta.Title
			} else {
				display = track.URL
			}
		}
		formattedQueue = append(formattedQueue, fmt.Sprintf("[%d] %s", i+1, display))
	}

	ctx.Reply("Current queue:\n" + strings.Join(formattedQueue, "\n"))
}
