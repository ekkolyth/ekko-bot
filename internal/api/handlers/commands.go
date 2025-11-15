package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type commandResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Response  string `json:"response"`
	CreatedAt string `json:"created_at"`
}

type commandCreateRequest struct {
	Name     string `json:"name"`
	Response string `json:"response"`
}

type commandUpdateRequest struct {
	Name     string `json:"name"`
	Response string `json:"response"`
}

// CommandsList returns all saved commands for the configured guild.
func CommandsList(service *db.CustomCommandService) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		commands, err := service.List(read.Context(), guildID)
		if err != nil {
			httpx.RespondError(write, http.StatusInternalServerError, "Failed to load commands")
			return
		}

		httpx.RespondJSON(write, http.StatusOK, mapCommands(commands))
	}
}

// CommandsCreate persists a new command name/response pair.
func CommandsCreate(service *db.CustomCommandService) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		defer read.Body.Close()

		var payload commandCreateRequest
		if err := json.NewDecoder(read.Body).Decode(&payload); err != nil {
			httpx.RespondError(write, http.StatusBadRequest, "Invalid request body")
			return
		}

		command, err := service.Create(read.Context(), guildID, payload.Name, payload.Response)
		if err != nil {
			switch {
			case errors.Is(err, db.ErrCustomCommandNameRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Command name is required")
			case errors.Is(err, db.ErrCustomCommandResponseRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Command response is required")
			case errors.Is(err, db.ErrCustomCommandExists):
				httpx.RespondError(write, http.StatusConflict, "Command already exists")
			default:
				httpx.RespondError(write, http.StatusInternalServerError, "Failed to create command")
			}
			return
		}

		httpx.RespondJSON(write, http.StatusCreated, mapCommand(command))
	}
}

// CommandsUpdate mutates an existing command name/response.
func CommandsUpdate(service *db.CustomCommandService) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		commandID := chi.URLParam(read, "id")
		if commandID == "" {
			httpx.RespondError(write, http.StatusBadRequest, "Command id is required")
			return
		}

		defer read.Body.Close()

		var payload commandUpdateRequest
		if err := json.NewDecoder(read.Body).Decode(&payload); err != nil {
			httpx.RespondError(write, http.StatusBadRequest, "Invalid request body")
			return
		}

		command, err := service.Update(read.Context(), guildID, commandID, payload.Name, payload.Response)
		if err != nil {
			switch {
			case errors.Is(err, db.ErrCustomCommandIDRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Command id is required")
			case errors.Is(err, db.ErrCustomCommandNameRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Command name is required")
			case errors.Is(err, db.ErrCustomCommandResponseRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Command response is required")
			case errors.Is(err, db.ErrCustomCommandExists):
				httpx.RespondError(write, http.StatusConflict, "Command already exists")
			case errors.Is(err, db.ErrCustomCommandNotFound):
				httpx.RespondError(write, http.StatusNotFound, "Command not found")
			default:
				httpx.RespondError(write, http.StatusInternalServerError, "Failed to update command")
			}
			return
		}

		httpx.RespondJSON(write, http.StatusOK, mapCommand(command))
	}
}

// CommandsDelete removes a command for the configured guild.
func CommandsDelete(service *db.CustomCommandService) http.HandlerFunc {
	return func(write http.ResponseWriter, read *http.Request) {
		guildID, errMsg := getGuildID()
		if errMsg != "" {
			httpx.RespondError(write, http.StatusInternalServerError, errMsg)
			return
		}

		commandID := chi.URLParam(read, "id")
		if commandID == "" {
			httpx.RespondError(write, http.StatusBadRequest, "Command id is required")
			return
		}

		if err := service.Delete(read.Context(), guildID, commandID); err != nil {
			switch {
			case errors.Is(err, db.ErrCustomCommandIDRequired):
				httpx.RespondError(write, http.StatusBadRequest, "Command id is required")
			default:
				httpx.RespondError(write, http.StatusInternalServerError, "Failed to delete command")
			}
			return
		}

		write.WriteHeader(http.StatusNoContent)
	}
}

func mapCommands(commands []*db.CustomCommand) []commandResponse {
	items := make([]commandResponse, 0, len(commands))
	for _, c := range commands {
		items = append(items, mapCommand(c))
	}
	return items
}

func mapCommand(command *db.CustomCommand) commandResponse {
	createdAt := ""
	if command.CreatedAt.Valid {
		createdAt = command.CreatedAt.Time.Format(time.RFC3339)
	}

	return commandResponse{
		ID:        uuidString(command.ID),
		Name:      command.Name,
		Response:  command.Response,
		CreatedAt: createdAt,
	}
}

func uuidString(value pgtype.UUID) string {
	if !value.Valid {
		return ""
	}
	u, err := uuid.FromBytes(value.Bytes[:])
	if err != nil {
		return ""
	}
	return u.String()
}
