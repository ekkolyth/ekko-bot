package youtube

import (
	"bytes"
	"os/exec"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

func SearchYoutube(query string) (string, bool) {
	cmd := exec.Command("yt-dlp", "--flat-playlist", "--get-url", "ytsearch1:"+query)
	var outputFromSearch bytes.Buffer
	cmd.Stdout = &outputFromSearch
	err := cmd.Run()
	if err != nil {
		logging.Error("Error: " + err.Error())
		return "", false
	}

	// Clean up the output - take only the first line
	url := strings.TrimSpace(outputFromSearch.String())
	if idx := strings.Index(url, "\n"); idx > 0 {
		url = url[:idx]
	}

	if url == "" {
		return "", false
	}

	// sanity check with validating the url

	if !httpx.IsValidURL(url) {
		return "", false
	}

	return url, true
}
