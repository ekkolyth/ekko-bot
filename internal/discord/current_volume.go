package discord

import (
	"fmt"

	"github.com/ekkolyth/ekko-bot/internal/context"
)

func CurrentVolume(ctx *context.Context) {
	var currentVolume float64
	context.VolumeMutex.Lock()
	currentVolume, ok := context.Volume[ctx.GetGuildID()]
	if !ok {
		currentVolume = 1.0 // Default volume if not set
		context.Volume[ctx.GetGuildID()] = 1.0
	}
	context.VolumeMutex.Unlock()
	// Convert to percentage for display
	currentVolume = currentVolume * 100.0 // Convert factor back to percentage
	ctx.Reply(fmt.Sprintf("Current volume is %.1f%%", currentVolume))
}
