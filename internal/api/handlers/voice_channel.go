package handlers

import (
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	appctx "github.com/ekkolyth/ekko-bot/internal/context"
)

type voiceChannelResponse struct {
	OK      bool             `json:"ok"`
	Channel *voiceChannelDTO `json:"channel,omitempty"`
	Error   string           `json:"error,omitempty"`
}

type voiceChannelDTO struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func VoiceChannelCurrent() http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		userID := read.URL.Query().Get("discord_user_id")
		if userID == "" {
			httpx.RespondJSON(write, http.StatusBadRequest, voiceChannelResponse{
				OK:    false,
				Error: "Missing discord_user_id",
			})
			return
		}

		if discordSessionProvider == nil {
			httpx.RespondJSON(write, http.StatusInternalServerError, voiceChannelResponse{
				OK:    false,
				Error: "Discord session not initialized",
			})
			return
		}

		session, _ := discordSessionProvider().(*discordgo.Session)
		if session == nil {
			httpx.RespondJSON(write, http.StatusInternalServerError, voiceChannelResponse{
				OK:    false,
				Error: "Discord session unavailable",
			})
			return
		}

		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondJSON(write, http.StatusInternalServerError, voiceChannelResponse{
				OK:    false,
				Error: errMsg,
			})
			return
		}

		channelID, channelName, err := getCachedVoiceChannel(session, guildID, userID)
		if err != nil {
			httpx.RespondJSON(write, http.StatusOK, voiceChannelResponse{
				OK:      true,
				Channel: nil,
			})
			return
		}

		httpx.RespondJSON(write, http.StatusOK, voiceChannelResponse{
			OK: true,
			Channel: &voiceChannelDTO{
				ID:   channelID,
				Name: channelName,
			},
		})
	}
}

func getCachedVoiceChannel(session *discordgo.Session, guildID, userID string) (string, string, error) {
	if channelID, ok := appctx.GetUserVoiceChannel(guildID, userID); ok && channelID != "" {
		name := channelName(session, channelID)
		return channelID, name, nil
	}

	return findUserVoiceChannel(session, guildID, userID)
}

func findUserVoiceChannel(session *discordgo.Session, guildID, userID string) (string, string, error) {
	guild, err := session.State.Guild(guildID)
	if err != nil {
		guild, err = session.Guild(guildID)
		if err != nil {
			return "", "", err
		}
	}

	for _, voiceState := range guild.VoiceStates {
		if voiceState.UserID == userID {
			name := channelName(session, voiceState.ChannelID)
			return voiceState.ChannelID, name, nil
		}
	}

	return "", "", http.ErrNoLocation
}

func channelName(session *discordgo.Session, channelID string) string {
	if channelID == "" {
		return ""
	}

	if ch, err := session.State.Channel(channelID); err == nil && ch != nil {
		return ch.Name
	}

	if fetched, err := session.Channel(channelID); err == nil && fetched != nil {
		return fetched.Name
	}

	return ""
}
