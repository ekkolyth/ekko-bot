package discord

import (
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"
	"github.com/ekkolyth/ekko-bot/internal/media"

	"github.com/bwmarrin/discordgo"
)

func PlayAudio(ctx *context.Context, url string, stop chan bool, pauseCh chan bool, done chan bool) {
	defer close(done) // Signal when this function exits

	var vc *discordgo.VoiceConnection
	var err error

	if !BotInChannel(ctx) {
		logging.Info("Bot not in channel, attempting to join voice channel: " + ctx.VoiceChannelID)
		vc, err = JoinUserVoiceChannel(ctx)
		if err != nil {
			logging.Error("Error joining voice channel: " + err.Error())
			ctx.Reply("Error joining voice channel.")
			return
		}
		logging.Info("Successfully joined voice channel")
	} else {
		logging.Info("Bot already in channel, getting existing connection")
		vc, err = GetVoiceConnection(ctx)
		if err != nil {
			logging.Error("Error getting voice connection: " + err.Error())
			ctx.Reply("Error with voice connection.")
			return
		}
	}

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)

	songDone := make(chan bool)
	go func() {
		media.StreamAudio(vc, url, queueKey, stop, pauseCh)
		close(songDone)
	}()

	<-songDone
	logging.Info("Song playback complete")
}
