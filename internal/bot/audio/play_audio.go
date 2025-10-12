package audio

import (
	"github.com/ekkolyth/ekko-bot/internal/bot/discord"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"

	"github.com/bwmarrin/discordgo"
)

func playAudio(ctx *state.Context, url string, stop chan bool, pauseCh chan bool, done chan bool) {
	defer close(done) // Signal when this function exits

	var vc *discordgo.VoiceConnection
	var err error

	if !discord.BotInChannel(ctx) {
		vc, err = discord.JoinUserVoiceChannel(ctx)
		if err != nil {
			logging.Error("Error joining voice channel: " + err.Error())
			ctx.Reply("Error joining voice channel.")
			return
		}
	} else {
		vc, err = discord.GetVoiceConnection(ctx)
		if err != nil {
			logging.Error("Error getting voice connection: " + err.Error())
			ctx.Reply("Error with voice connection.")
			return
		}
	}

	songDone := make(chan bool)
	go func() {
		PlayURL(vc, url, stop, pauseCh)
		close(songDone)
	}()

	<-songDone
	logging.Info("Song playback complete")
}
