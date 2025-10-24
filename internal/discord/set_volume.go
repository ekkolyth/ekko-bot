package discord

import (
	"fmt"
	"strconv"

	"github.com/ekkolyth/ekko-bot/internal/context"
)

func SetVolume(ctx *context.Context) {
	volume := ctx.Arguments["level"]

	if len(volume) < 1 {
		CurrentVolume(ctx)
		return
	}

	newVolume, err := strconv.ParseFloat(volume, 64)
	if err != nil || newVolume < 0.0 || newVolume > 200.0 {
		ctx.Reply("Invalid volume value. Please specify a number between 0 and 200.")
		return
	}
	var preservedVolume float64 = newVolume
	// Normalize the volume to a range of 0.0 to 2.0
	newVolume = newVolume / 100.0 // Convert percentage to a factor

	context.VolumeMutex.Lock()
	if _, ok := context.Volume[ctx.GetGuildID()]; !ok {
		context.Volume[ctx.GetGuildID()] = 1.0 // Initialize to default if not set
	}
	context.Volume[ctx.GetGuildID()] = newVolume
	context.VolumeMutex.Unlock()

	ctx.Reply(fmt.Sprintf("Volume set to %.1f%%", preservedVolume))
}
