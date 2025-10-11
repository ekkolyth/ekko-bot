package commands

import "github.com/ekkolyth/ekko-bot/internal/shared/state"

func Ping(ctx *state.Context) {
	ctx.Reply("Ping")
}
