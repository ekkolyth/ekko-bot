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
    
    guild, err := ctx.GetSession().State.Guild(guildID)
    if err != nil {
        return nil, err
    }

    // Prefer user's current voice channel if available
    for _, vs := range guild.VoiceStates {
        if ctx.GetUser() != nil && vs.UserID == ctx.GetUser().ID {
            vc, err := ctx.GetSession().ChannelVoiceJoin(guildID, vs.ChannelID, false, true)
            if err != nil {
                return nil, err
            }
            return vc, nil
        }
    }

    // Fallback for web/API calls: use VoiceChannelID from context
    if ctx.VoiceChannelID != "" {
        vc, err := ctx.GetSession().ChannelVoiceJoin(guildID, ctx.VoiceChannelID, false, true)
        if err != nil {
            return nil, err
        }
        return vc, nil
    }

    return nil, os.ErrNotExist
}

func IsUserInVoiceChannel(ctx *context.Context) bool {
	guildID := ctx.GetGuildID()
	if !httpx.ValidDiscordSnowflake(guildID) {
		return false
	}
	
	guild, err := ctx.GetSession().State.Guild(guildID)
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
