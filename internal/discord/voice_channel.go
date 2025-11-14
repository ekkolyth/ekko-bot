package discord

import (
	"fmt"
	"os"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/context"

	"github.com/bwmarrin/discordgo"
)

func GetVoiceConnection(ctx *context.Context) (*discordgo.VoiceConnection, error) {
	guildID := ctx.GetGuildID()
	if !httpx.ValidDiscordSnowflake(guildID) {
		return nil, fmt.Errorf("invalid guild ID in context: %q (must be a valid Discord snowflake)", guildID)
	}

	vc := ctx.GetSession().VoiceConnections[guildID]
	if vc == nil {
		return nil, os.ErrNotExist
	}
	return vc, nil
}

func BotInChannel(ctx *context.Context) bool {
	// determines whether the bot is in the guild's channel
	_, err := GetVoiceConnection(ctx)
	return err == nil
}

func JoinUserVoiceChannel(ctx *context.Context) (*discordgo.VoiceConnection, error) {
	guildID := ctx.GetGuildID()
	if !httpx.ValidDiscordSnowflake(guildID) {
		return nil, fmt.Errorf("invalid guild ID in context: %q (must be a valid Discord snowflake)", guildID)
	}

	if ensureVoiceChannelID(ctx) {
		vc, err := ctx.GetSession().ChannelVoiceJoin(guildID, ctx.VoiceChannelID, false, true)
		if err != nil {
			return nil, err
		}
		return vc, nil
	}

	return nil, os.ErrNotExist
}

func IsUserInVoiceChannel(ctx *context.Context) bool {
	return ensureVoiceChannelID(ctx)
}

func ensureVoiceChannelID(ctx *context.Context) bool {
	if ctx.VoiceChannelID != "" {
		return true
	}

	channelID := userVoiceChannelID(ctx)
	if channelID == "" {
		return false
	}

	ctx.VoiceChannelID = channelID
	return true
}

func userVoiceChannelID(ctx *context.Context) string {
	guildID := ctx.GetGuildID()
	if !httpx.ValidDiscordSnowflake(guildID) {
		return ""
	}

	guild, err := ctx.GetSession().State.Guild(guildID)
	if err != nil {
		return ""
	}

	user := ctx.GetUser()
	if user == nil {
		return ""
	}

	for _, vs := range guild.VoiceStates {
		if vs.UserID == user.ID {
			return vs.ChannelID
		}
	}

	return ""
}
