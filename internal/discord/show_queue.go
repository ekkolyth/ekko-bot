package discord

import (
	"fmt"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/context"
)

func ShowQueue(ctx *context.Context) {
	context.QueueMutex.Lock()
	defer context.QueueMutex.Unlock()

	if len(context.Queue[ctx.GetGuildID()]) == 0 {
		ctx.Reply("Queue is empty.")
		return
	}

	// Make a formatted list of songs, "[N] URL""
	var formattedQueue []string
	for i, song := range context.Queue[ctx.GetGuildID()] {
		formattedQueue = append(formattedQueue, fmt.Sprintf("[%d] %s", i+1, song))
	}

	ctx.Reply("Current queue:\n" + strings.Join(formattedQueue, "\n"))
}
