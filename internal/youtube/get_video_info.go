package youtube

import (
	"encoding/json"
	"os/exec"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/logging"
)

// VideoInfo represents metadata about a video
type VideoInfo struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	Artist    string `json:"artist"`
	Duration  int    `json:"duration"`
	Thumbnail string `json:"thumbnail"`
}

// GetVideoInfo fetches metadata for a YouTube video URL using yt-dlp
func GetVideoInfo(url string) (*VideoInfo, error) {
	// Use yt-dlp to get video info in JSON format
	cmd := exec.Command("yt-dlp", "--dump-json", "--no-playlist", url)
	output, err := cmd.Output()
	if err != nil {
		logging.Error("Error fetching video info: " + err.Error())
		return nil, err
	}

	// Parse the JSON output
	var rawInfo struct {
		Title     string `json:"title"`
		Uploader  string `json:"uploader"`
		Channel   string `json:"channel"`
		Artist    string `json:"artist"`
		Duration  int    `json:"duration"`
		Thumbnail string `json:"thumbnail"`
		WebpageURL string `json:"webpage_url"`
	}

	if err := json.Unmarshal(output, &rawInfo); err != nil {
		logging.Error("Error parsing video info JSON: " + err.Error())
		return nil, err
	}

	// Determine the best "artist" name
	artist := rawInfo.Artist
	if artist == "" {
		artist = rawInfo.Channel
	}
	if artist == "" {
		artist = rawInfo.Uploader
	}

	info := &VideoInfo{
		Title:     strings.TrimSpace(rawInfo.Title),
		URL:       url,
		Artist:    strings.TrimSpace(artist),
		Duration:  rawInfo.Duration,
		Thumbnail: rawInfo.Thumbnail,
	}

	return info, nil
}

// GetVideoInfoQuick returns basic info quickly (title from URL or basic fetch)
func GetVideoInfoQuick(url string) string {
	info, err := GetVideoInfo(url)
	if err != nil || info.Title == "" {
		// Fallback to URL if we can't get the title
		return url
	}

	if info.Artist != "" {
		return info.Title + " - " + info.Artist
	}

	return info.Title
}
