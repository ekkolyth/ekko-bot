package context

import (
	"sync"
	"time"

	"layeh.com/gopus"
)

// TrackInfo holds metadata about a track
type TrackInfo struct {
	URL       string
	Title     string
	Artist    string
	Duration  int
	Thumbnail string
	AddedBy   string
	AddedByID string
}

func init() {
	StartTime = time.Now()
}

var (
	// from .env
	Token string

	// Set of disabled commands
	DisabledCommands = make(map[string]bool)

	// Queue Key (guild:voiceChannel) -> Currently playing track URL
	NowPlaying      = make(map[string]string)
	NowPlayingMutex sync.Mutex

	// Queue Key (guild:voiceChannel) -> Currently playing track metadata
	NowPlayingInfo      = make(map[string]*TrackInfo)
	NowPlayingInfoMutex sync.Mutex

	// Queue Key (guild:voiceChannel) -> Pause state
	Paused     = make(map[string]bool)
	PauseMutex sync.Mutex

	// Queue Key (guild:voiceChannel) -> Volume
	Volume      = make(map[string]float64)
	VolumeMutex sync.Mutex

	// Queue Key (guild:voiceChannel) -> Stop channels
	StopChannels = make(map[string]chan bool)
	StopMutex    sync.Mutex

	// Queue Key (guild:voiceChannel) -> Pause channels
	PauseChs     = make(map[string]chan bool)
	PauseChMutex sync.Mutex

	OpusEncoder *gopus.Encoder

	// Time when the bot started
	StartTime time.Time

	// short hash of all go source files for version command
	GoSourceHash string

	// Guild ID -> User ID -> Voice Channel ID
	UserVoiceChannels = make(map[string]map[string]string)
	UserVoiceMutex    sync.RWMutex
)
