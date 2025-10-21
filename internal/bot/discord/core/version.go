package core

import (
	"github.com/ekkolyth/ekko-bot/internal/shared/context"
	"github.com/ekkolyth/ekko-bot/internal/shared/validation"

	"github.com/bwmarrin/discordgo"
)

func Version(ctx *context.Context) {
	if !validation.HasPermission(ctx, discordgo.PermissionAdministrator) {
		ctx.Reply("You do not have permission to use this command.")
		return
	}
	ctx.Reply("Version: " + context.GoSourceHash)
}
