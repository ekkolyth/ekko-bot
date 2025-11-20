package music

import (
	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/discord"
	"github.com/ekkolyth/ekko-bot/internal/ffmpeg"
	"github.com/ekkolyth/ekko-bot/internal/logging"

	"github.com/bwmarrin/discordgo"
)

func PlayAudio(ctx *context.Context, url string, stop chan bool, pauseCh chan bool, done chan bool) {
	defer close(done) // Signal when this function exits

	var vc *discordgo.VoiceConnection
	var err error

	if !discord.BotInChannel(ctx) {
		logging.Info("Bot not in channel, attempting to join voice channel: " + ctx.VoiceChannelID)
		vc, err = discord.JoinUserVoiceChannel(ctx)
		if err != nil {
			logging.Error("Error joining voice channel: " + err.Error())
			ctx.Reply("Error joining voice channel.")
			return
		}
		logging.Info("Successfully joined voice channel")
	} else {
		logging.Info("Bot already in channel, getting existing connection")
		vc, err = discord.GetVoiceConnection(ctx)
		if err != nil {
			logging.Error("Error getting voice connection: " + err.Error())
			ctx.Reply("Error with voice connection.")
			return
		}
	}

	queueKey := context.QueueKey(ctx.GetGuildID(), ctx.VoiceChannelID)

	songDone := make(chan bool)
	go func() {
		ffmpeg.StreamAudio(vc, url, queueKey, stop, pauseCh)
		close(songDone)
	}()

	<-songDone
	logging.Info("Song playback complete")
}
