package youtube

import (
	"errors"
	"net/url"
	"strings"
)

// NormalizeYouTubeURL extracts the video ID from multiple YouTube URL formats and
// returns a canonical https://www.youtube.com/watch?v=ID form.
func NormalizeYouTubeURL(inputURL string) (string, string, error) {
	if inputURL == "" {
		return "", "", errors.New("empty URL")
	}

	var videoID string

	// 1) youtu.be short links
	// Example: https://youtu.be/xHimP0uwink?si=123
	if strings.Contains(inputURL, "youtu.be/") {
		// Everything after youtu.be/
		after := strings.SplitN(inputURL, "youtu.be/", 2)[1]
		videoID = stripDelimiters(after)
	}

	// 2) music.youtube.com links — use v= param
	// Example: https://music.youtube.com/watch?v=xHimP0uwink
	if videoID == "" && strings.Contains(inputURL, "music.youtube.com") {
		id, err := extractQueryParam(inputURL, "v")
		if err != nil {
			return "", "", err
		}
		videoID = stripDelimiters(id)
	}

	// 3) Regular YouTube watch links — same v= logic
	// Example: https://www.youtube.com/watch?v=xHimP0uwink&list=RD...
	if videoID == "" && strings.Contains(inputURL, "youtube.com/watch") {
		id, err := extractQueryParam(inputURL, "v")
		if err != nil {
			return "", "", err
		}
		videoID = stripDelimiters(id)
	}

	if videoID == "" {
		return "", "", errors.New("unsupported YouTube URL format")
	}

	canonical := "https://www.youtube.com/watch?v=" + videoID
	return canonical, videoID, nil
}

// stripDelimiters removes ?, &, and # with everything after them.
func stripDelimiters(s string) string {
	delims := []string{"?", "&", "#"}
	for _, d := range delims {
		if idx := strings.Index(s, d); idx != -1 {
			s = s[:idx]
		}
	}
	return s
}

// extractQueryParam extracts a single query param from a URL.
func extractQueryParam(rawURL, key string) (string, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}
	value := parsed.Query().Get(key)
	if value == "" {
		return "", errors.New("missing query param: " + key)
	}
	return value, nil
}
