package command

import (
	"strconv"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/shared/context"

	"github.com/bwmarrin/discordgo"
)

func NukeMessages(ctx *context.Context) {
	// check if the user has permission to manage messages
	if !context.HasPermission(ctx, discordgo.PermissionManageMessages) {
		ctx.Reply("You do not have permission to use this command.")
		return
	}

	if ctx.Arguments["count"] == "" {
		ctx.Reply("Usage: !nuke <number of messages>")
		return
	}
	num, err := strconv.Atoi(ctx.Arguments["count"])
	if err != nil {
		ctx.Reply("Invalid number of messages")
		return
	}
	if num < 1 || num > 100 {
		ctx.Reply("Please specify a number between 1 and 100")
		return
	}
	num++ // Include the command message itself

	messages, err := ctx.GetSession().ChannelMessages(ctx.GetChannelID(), num, "", "", "")
	if err != nil {
		ctx.Reply("Error fetching messages")
		return
	}
	for _, message := range messages {
		ctx.GetSession().ChannelMessageDelete(ctx.GetChannelID(), message.ID)
		time.Sleep(20 * time.Millisecond) // Rate limit to avoid hitting Discord's API limits
	}
	ctx.Reply("Nuked " + strconv.Itoa(num-1) + " messages.")
}
