package core

import (
	"strconv"
	"strings"
	"time"

	"github.com/ekkolyth/ekko-bot/internal/shared/context"
	"github.com/ekkolyth/ekko-bot/internal/shared/validation"

	"github.com/bwmarrin/discordgo"
)

func Uptime(ctx *context.Context) {
	if !validation.HasPermission(ctx, discordgo.PermissionAdministrator) {
		ctx.Reply("You do not have permission to use this command.")
		return
	}
	timeNow := time.Now()
	uptime := timeNow.Sub(context.StartTime)
	// convert to days, hours, minutes, seconds
	days := int(uptime.Hours() / 24)
	hours := int(uptime.Hours()) % 24
	minutes := int(uptime.Minutes()) % 60
	seconds := int(uptime.Seconds()) % 60

	var uptimeMessage strings.Builder
	if days > 0 {
		if days == 1 {
			uptimeMessage.WriteString("1 day, ")
		} else {
			uptimeMessage.WriteString(strconv.Itoa(days) + " days, ")
		}
	}
	if hours > 0 {
		if hours == 1 {
			uptimeMessage.WriteString("1 hour, ")
		} else {
			uptimeMessage.WriteString(strconv.Itoa(hours) + " hours, ")
		}
	}
	if minutes > 0 {
		if minutes == 1 {
			uptimeMessage.WriteString("1 minute and ")
		} else {

			uptimeMessage.WriteString(strconv.Itoa(minutes) + " minutes and ")
		}
	}
	if seconds > 0 {
		if seconds == 1 {
			uptimeMessage.WriteString("1 second")
		} else {
			uptimeMessage.WriteString(strconv.Itoa(seconds) + " seconds")
		}
	}

	ctx.Reply("Uptime: " + uptimeMessage.String())
}
