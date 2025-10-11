package core

import (
	"os"

	"github.com/ekkolyth/ekko-bot/internal/shared/state"
)

func Unknown(ctx *state.Context) {
	// Check .env for how to handle unknown commands
	// default case is "ignore"

	unknown_commands := os.Getenv("UNKNOWN_COMMANDS")
	switch unknown_commands {
	case "help":
		Help(ctx)
	case "error":
		ctx.Reply("Unknown command. Type /help for a list of commands.")
	default:
		return
	}
}
