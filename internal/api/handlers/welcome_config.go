package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	appdb "github.com/ekkolyth/ekko-bot/internal/db"
)

type welcomeConfigResponse struct {
	ChannelID *string `json:"channel_id"`
	Message   *string `json:"message"`
}

type welcomeConfigRequest struct {
	ChannelID string `json:"channel_id"`
	Message   string `json:"message"`
}

func WelcomeConfigGet(service *appdb.GuildConfigService) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		if service == nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Welcome config unavailable")
			return
		}

		settings, err := service.GetWelcomeSettings(read.Context(), guildID)
		if err != nil && !errors.Is(err, appdb.ErrGuildIDRequired) {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to load welcome settings")
			return
		}

		if settings == nil {
			httpx.RespondJSON(write, http.StatusOK, welcomeConfigResponse{})
			return
		}

		httpx.RespondJSON(write, http.StatusOK, welcomeConfigResponse{
			ChannelID: settings.ChannelID,
			Message:   settings.Message,
		})
	}
}

func WelcomeConfigSave(service *appdb.GuildConfigService) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		if service == nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Welcome config unavailable")
			return
		}

		defer read.Body.Close()

		var payload welcomeConfigRequest
		if err := json.NewDecoder(read.Body).Decode(&payload); err != nil {
			httpx.RespondError(write, http.StatusBadRequest, "Invalid request body")
			return
		}

		settings, err := service.SaveWelcomeSettings(read.Context(), guildID, payload.ChannelID, payload.Message)
		if err != nil {
			switch {
			case errors.Is(err, appdb.ErrGuildIDRequired):
				httpx.RespondError(write, http.StatusInternalServerError, "Guild id missing")
			case errors.Is(err, appdb.ErrWelcomeChannelRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Select a channel")
			case errors.Is(err, appdb.ErrWelcomeMessageRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Enter a welcome message")
			case errors.Is(err, appdb.ErrWelcomeMessageTooLong):
				httpx.RespondError(write, http.StatusBadRequest, "Welcome message is too long")
			default:
				httpx.RespondError(write, http.StatusInternalServerError, "Failed to save welcome settings")
			}
			return
		}

		httpx.RespondJSON(write, http.StatusOK, welcomeConfigResponse{
			ChannelID: settings.ChannelID,
			Message:   settings.Message,
		})
	}
}
