package commands

import "github.com/ekkolyth/ekko-bot/internal/state"

func Ping(ctx *state.Context) {
	ctx.Reply("Ping")
}
