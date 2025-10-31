package media

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"io"
	"os/exec"
	"strconv"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/ekkolyth/ekko-bot/internal/api/httpx"
	"github.com/ekkolyth/ekko-bot/internal/config"
	"github.com/ekkolyth/ekko-bot/internal/context"
)

// Discord voice server/channel.  voice websocket and udp socket
// must already be setup before this will work.
func StreamAudio(v *discordgo.VoiceConnection, url string, queueKey string, stop <-chan bool, pauseCh <-chan bool) {

	if !httpx.IsValidURL(url) {
		OnError("Invalid URL"+url, nil)
		return
	}

	// Create the yt-dlp command to download only the audio with best quality
	ytDlpCmd := exec.Command("yt-dlp",
		"-f", "bestaudio",
		"--no-playlist",
		"-o", "-",
		url) // Get only audio, best quality

	// Capture stderr for error logging
	ytDlpStderr := &bytes.Buffer{}
	ytDlpCmd.Stderr = ytDlpStderr

	ffmpegCmd := exec.Command("ffmpeg", "-i", "pipe:0", "-f", "s16le", "-ar", strconv.Itoa(config.FrameRate), "-ac", strconv.Itoa(config.Channels), "pipe:1")

	// Capture stderr for error logging
	ffmpegStderr := &bytes.Buffer{}
	ffmpegCmd.Stderr = ffmpegStderr

	// Track if processes have been cleaned up to avoid double Wait()
	var processesCleaned bool
	var cleanupMutex sync.Mutex
	
	cleanupProcesses := func() {
		cleanupMutex.Lock()
		defer cleanupMutex.Unlock()
		if processesCleaned {
			return
		}
		processesCleaned = true
		
		if ytDlpCmd.Process != nil {
			ytDlpCmd.Process.Kill()
		}
		if ffmpegCmd.Process != nil {
			ffmpegCmd.Process.Kill()
		}
	}
	
	// Setup proper cleanup to ensure processes terminate
	defer cleanupProcesses()

	// Connect yt-dlp output to ffmpeg input
	ytDlpOut, err := ytDlpCmd.StdoutPipe()
	if err != nil {
		OnError("yt-dlp StdoutPipe Error", err)
		return
	}

	ffmpegIn, err := ffmpegCmd.StdinPipe()
	if err != nil {
		OnError("ffmpeg StdinPipe Error", err)
		return
	}

	ffmpegOut, err := ffmpegCmd.StdoutPipe()
	if err != nil {
		OnError("ffmpeg StdoutPipe Error", err)
		return
	}

	// Start the yt-dlp and ffmpeg processes
	err = ytDlpCmd.Start()
	if err != nil {
		OnError("yt-dlp Start Error", err)
		return
	}

	err = ffmpegCmd.Start()
	if err != nil {
		OnError("ffmpeg Start Error", err)
		// Check for stderr output from yt-dlp
		if ytDlpStderr.Len() > 0 {
			OnError("yt-dlp stderr: "+ytDlpStderr.String(), nil)
		}
		return
	}

	// Monitor yt-dlp process for errors in background
	ytDlpWaitDone := make(chan bool, 1)
	go func() {
		defer func() { ytDlpWaitDone <- true }()
		if err := ytDlpCmd.Wait(); err != nil {
			if ytDlpStderr.Len() > 0 {
				OnError("yt-dlp failed: "+ytDlpStderr.String(), err)
			} else {
				OnError("yt-dlp process exited with error", err)
			}
		}
	}()
	
	// Monitor ffmpeg process for errors in background
	ffmpegWaitDone := make(chan bool, 1)
	go func() {
		defer func() { ffmpegWaitDone <- true }()
		if err := ffmpegCmd.Wait(); err != nil {
			if ffmpegStderr.Len() > 0 {
				OnError("ffmpeg failed: "+ffmpegStderr.String(), err)
			} else {
				OnError("ffmpeg process exited with error", err)
			}
		}
	}()

	// Pipe yt-dlp output to ffmpeg input
	go func() {
		_, err := io.Copy(ffmpegIn, ytDlpOut)
		if err != nil {
			OnError("Error copying yt-dlp output to ffmpeg input", err)
		}
		ffmpegIn.Close() // Important: close the pipe when done
	}()

	// Set up reading from ffmpeg output
	ffmpegbuf := bufio.NewReaderSize(ffmpegOut, config.FfmpegBufferSize)

	// Handle stopping processes if needed
	go func() {
		select {
		case <-stop:
			cleanupProcesses()
		case <-time.After(3 * time.Hour): // Fallback timeout
			cleanupProcesses()
		}
	}()

	// Make sure voice connection is ready before starting
	time.Sleep(100 * time.Millisecond)

	// Set voice speaking status
	err = v.Speaking(true)
	if err != nil {
		OnError("Couldn't set speaking", err)
	}

	// Stop speaking when done (voice overlay feature)
	defer func() {
		cleanupProcesses()
		// Wait for Wait() calls to complete to avoid waitid errors
		select {
		case <-ytDlpWaitDone:
		case <-time.After(1 * time.Second):
		}
		select {
		case <-ffmpegWaitDone:
		case <-time.After(1 * time.Second):
		}
		err := v.Speaking(false)
		if err != nil {
			OnError("Couldn't stop speaking", err)
		}
	}()

	send := make(chan []int16, 2)
	defer close(send)

	closeCh := make(chan bool)
	go func() {
		SendPCM(v, send)
		closeCh <- true
	}()

	// Add a minimum playback timer for very short clips
	minPlayTimer := time.NewTimer(500 * time.Millisecond)
	defer minPlayTimer.Stop()

	dataReceived := false

	// Track pause state
	isPaused := false

	// Stream audio from ffmpeg
	for {
		// Check pause channel
		select {
		case newState := <-pauseCh:
			isPaused = newState
			continue
		default:
			// No new pause state, continue
		}

		// If paused, wait and check again
		if isPaused {
			time.Sleep(100 * time.Millisecond)
			continue
		}
		audiobuf := make([]int16, config.FrameSize*config.Channels)


		// Process audio normally
		err = binary.Read(ffmpegbuf, binary.LittleEndian, &audiobuf)
		if err == io.EOF || err == io.ErrUnexpectedEOF {
			if !dataReceived {
				// If we never got any data, wait a bit more
				select {
				case <-minPlayTimer.C:
					return
				case <-closeCh:
					return
				}
			}
			return
		}
		if err != nil {
			OnError("Error reading from ffmpeg stdout", err)
			return
		}

		dataReceived = true

		// Apply volume adjustment
		// Use queueKey for per-voice-channel volume
		context.VolumeMutex.Lock()
		currentVolume, ok := context.Volume[queueKey]
		if !ok {
			currentVolume = 1.0
			context.Volume[queueKey] = 1.0
		}
		context.VolumeMutex.Unlock()

		for i := range audiobuf {
			// Calculate new value and clamp to int16 range to prevent distortion
			newValue := float64(audiobuf[i]) * currentVolume
			if newValue > config.MaxClampValue {
				newValue = config.MaxClampValue
			} else if newValue < config.MinClampValue {
				newValue = config.MinClampValue
			}
			audiobuf[i] = int16(newValue)
		}

		// Send audio data to channel
		select {
		case send <- audiobuf:
		case <-closeCh:
			return
		}
	}
}
