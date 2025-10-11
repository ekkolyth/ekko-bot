package handlers

import (
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"

	"github.com/bwmarrin/discordgo"
)

func HandleInteractionCreate(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// Handle slash commands
	if i.Type != discordgo.InteractionApplicationCommand {
		return
	}

	ctx := state.NewInteractionContext(s, i)

	logging.InteractionCreateLog(ctx.User.Username, ctx.CommandName, ctx.ArgumentstoString())
	commandSelector(ctx)
}
