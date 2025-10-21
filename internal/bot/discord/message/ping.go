package message

import "github.com/ekkolyth/ekko-bot/internal/shared/context"

func Ping(ctx *context.Context) {
	ctx.Reply("Ping")
}
