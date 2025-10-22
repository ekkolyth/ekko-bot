package config

const (
	// magic numbers
	Channels  int = 2                   // 1 for mono, 2 for stereo
	FrameRate int = 48000               // audio sampling rate
	FrameSize int = 960                 // uint16 size of each audio frame
	MaxBytes  int = (FrameSize * 2) * 2 // max size of opus data

	FfmpegBufferSize int = 16384 // 2^14

	MaxClampValue float64 = 32767  // max volume
	MinClampValue float64 = -32768 // min volume

	// ANSI color codes for terminal output
	CLI_RESET = "\033[0m"
	CLI_BOLD  = "\033[1m"

	CLI_BLACK   = "\033[30m"
	CLI_RED     = "\033[31m"
	CLI_GREEN   = "\033[32m"
	CLI_YELLOW  = "\033[33m"
	CLI_BLUE    = "\033[34m"
	CLI_MAGENTA = "\033[35m"
	CLI_CYAN    = "\033[36m"
	CLI_WHITE   = "\033[37m"

	CLI_BRIGHT_BLACK   = "\033[90m"
	CLI_BRIGHT_RED     = "\033[91m"
	CLI_BRIGHT_GREEN   = "\033[92m"
	CLI_BRIGHT_YELLOW  = "\033[93m"
	CLI_BRIGHT_BLUE    = "\033[94m"
	CLI_BRIGHT_MAGENTA = "\033[95m"
	CLI_BRIGHT_CYAN    = "\033[96m"
	CLI_BRIGHT_WHITE   = "\033[97m"
)
