package commands

import "github.com/ekkolyth/ekko-bot/internal/shared/state"

func Pong(ctx *state.Context) {
	ctx.Reply("Pong")
}
