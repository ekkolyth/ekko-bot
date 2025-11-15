# Audio Quality Observations

## Streaming Pipeline
- `internal/media/stream_audio.go` uses a PCM channel depth of `2`; short CPU stalls in Docker empty the buffer and Discord hears gaps. Increase the buffer (e.g., 16–32 frames) and add an intermediate FIFO to keep packets flowing when ffmpeg hiccups.
- ffmpeg currently runs with defaults. Add reconnect options (`-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5`), disable demux buffering (`-fflags +nobuffer`), and specify a higher quality resampler (`-af aresample=async=1:first_pts=0`) to avoid bursty PCM output.
- The ffmpeg stdout reader is 16 KB. Bumping `config.FfmpegBufferSize` (currently `16384`) provides more headroom so tiny scheduling delays don’t immediately starve Discord.

## Encoder Usage
- `internal/media/send_pcm.go` recreates and stores the encoder in `context.OpusEncoder` for each stream. Multiple voice sessions race on the same pointer and fight for GC time. Keep the encoder local to the goroutine so each connection has its own state.
- The encoder loop exits when `v.OpusSend` blocks or becomes nil, so transient Discord send hiccups terminate playback. Consider retrying with a short backoff before abandoning the stream.

## Runtime Environment
- The runtime container launches Redis, the bot, API server, and the Nitro web server under one cgroup. Even with low aggregate CPU, those extra processes steal slices from ffmpeg/Go. Run the bot in its own container or raise its CPU shares and grant `SYS_NICE` so it can request higher scheduling priority.
- Docker Compose uses default network and cgroup settings. Host networking (if acceptable) or increased blkio/CPU reservations reduce jitter introduced by the bridge network and CFS quotas.

