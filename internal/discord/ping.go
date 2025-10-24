package discord

import "github.com/ekkolyth/ekko-bot/internal/context"

func Ping(ctx *context.Context) {
	ctx.Reply("Ping")
}
