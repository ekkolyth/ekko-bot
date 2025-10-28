package discord

import (
	"os"

	"github.com/ekkolyth/ekko-bot/internal/context"

	"github.com/bwmarrin/discordgo"
)

func GetVoiceConnection(ctx *context.Context) (*discordgo.VoiceConnection, error) {
	vc := ctx.GetSession().VoiceConnections[ctx.GetGuildID()]
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
    guild, err := ctx.GetSession().State.Guild(ctx.GetGuildID())
    if err != nil {
        return nil, err
    }

    // Prefer user's current voice channel if available
    for _, vs := range guild.VoiceStates {
        if ctx.GetUser() != nil && vs.UserID == ctx.GetUser().ID {
            vc, err := ctx.GetSession().ChannelVoiceJoin(ctx.GuildID, vs.ChannelID, false, true)
            if err != nil {
                return nil, err
            }
            return vc, nil
        }
    }

    // Fallback for web/API calls: use VoiceChannelID from context
    if ctx.VoiceChannelID != "" {
        vc, err := ctx.GetSession().ChannelVoiceJoin(ctx.GuildID, ctx.VoiceChannelID, false, true)
        if err != nil {
            return nil, err
        }
        return vc, nil
    }

    return nil, os.ErrNotExist
}

func IsUserInVoiceChannel(ctx *context.Context) bool {
	guild, err := ctx.GetSession().State.Guild(ctx.GetGuildID())
	if err != nil {
		return false
	}

	for _, vs := range guild.VoiceStates {
		if vs.UserID == ctx.GetUser().ID {
			return true
		}
	}
	return false
}
