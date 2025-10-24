package handlers

import (
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"

	"github.com/bwmarrin/discordgo"
)

func HandleInteractionCreate(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// Handle slash commands
	if i.Type != discordgo.InteractionApplicationCommand {
		return
	}

	ctx := context.NewInteractionContext(s, i)

	logging.InteractionCreate(ctx.User.Username, ctx.CommandName, ctx.ArgumentstoString())
	commandSelector(ctx)
}
