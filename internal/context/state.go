package context

import (
	"sync"
	"time"

	"layeh.com/gopus"
)

func init() {
	StartTime = time.Now()
}

var (
	// from .env
	Token        string

	// Set of disabled commands
	DisabledCommands = make(map[string]bool)

	// Guild ID -> Queue of URLs
	Queue        = make(map[string][]string)
	QueueMutex   sync.Mutex

	Playing      = make(map[string]bool)
	PlayingMutex sync.Mutex

	// Guild ID -> Pause state
	Paused       = make(map[string]bool)
	PauseMutex   sync.Mutex

	// Guild ID -> Volume
	Volume       = make(map[string]float64)
	VolumeMutex  sync.Mutex

	StopChannels = make(map[string]chan bool)
	StopMutex    sync.Mutex

	// Map of guild ID to pause channels
	PauseChs     = make(map[string]chan bool)
	PauseChMutex sync.Mutex

	OpusEncoder  *gopus.Encoder

	// Time when the bot started
	StartTime time.Time

	// short hash of all go source files for version command
	GoSourceHash string
)
