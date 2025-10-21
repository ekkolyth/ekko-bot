package audio

import (
	"github.com/ekkolyth/ekko-bot/internal/shared/config"
	"github.com/ekkolyth/ekko-bot/internal/shared/context"

	"github.com/bwmarrin/discordgo"
	"layeh.com/gopus"
)

// SendPCM will receive on the provied channel encode
// received PCM data into Opus then send that to Discordgo
func SendPCM(v *discordgo.VoiceConnection, pcm <-chan []int16) {
	if pcm == nil {
		return
	}

	var err error

	context.OpusEncoder, err = gopus.NewEncoder(config.FrameRate, config.Channels, gopus.Audio)

	if err != nil {
		OnError("NewEncoder Error", err)
		return
	}

	for {

		// read pcm from chan, exit if channel is closed.
		recv, ok := <-pcm
		if !ok {
			return
		}

		// try encoding pcm frame with Opus
		opus, err := context.OpusEncoder.Encode(recv, config.FrameSize, config.MaxBytes)
		if err != nil {
			OnError("Encoding Error", err)
			return
		}

		if !v.Ready || v.OpusSend == nil {
			// OnError(fmt.Sprintf("Discordgo not ready for opus packets. %+v : %+v", v.Ready, v.OpusSend), nil)
			// Sending errors here might not be suited
			return
		}
		// send encoded opus data to the sendOpus channel
		v.OpusSend <- opus
	}
}
