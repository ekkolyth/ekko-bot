package handlers

import (
	"net/http"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/discord"
)

type queueAdd struct {
	URL string `json:"url"`
}

func QueueAdd(write http.ResponseWriter, read *http.Request) {
	var request queueAdd

	if err := httpx.DecodeJSON(write, read, &request, 1<<20); err != nil {
		httpx.RespondError(write, http.StatusBadRequest, err.Error())
		return
	}

	if !httpx.IsValidURL(request.URL) {
		httpx.RespondError(write, http.StatusBadRequest, "Invalid URL")
		return
	}

	httpx.RespondJSON(write, http.StatusCreated, map[string]any{
		"ok": true,
		"youtubeUrl": request.URL,
	})
	discord.AddSong(nil, false, request.URL)
	println(request.URL)
}
