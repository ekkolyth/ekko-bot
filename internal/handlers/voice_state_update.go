package handlers

import (
	appctx "github.com/ekkolyth/ekko-bot/internal/context"

	"github.com/bwmarrin/discordgo"
)

func HandleVoiceStateUpdate(_ *discordgo.Session, update *discordgo.VoiceStateUpdate) {
	if update == nil || update.VoiceState == nil {
		return
	}

	state := update.VoiceState
	appctx.SetUserVoiceChannel(state.GuildID, state.UserID, state.ChannelID)
}
