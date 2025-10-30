# Dashboard Music Player Implementation

## Overview
Successfully implemented a real-time music player for the dashboard with full queue management capabilities.

## Backend Changes

### New API Endpoints (`internal/api/handlers/queue.go`)
1. **GET `/api/queue`** - Get queue for a voice channel
   - Returns tracks, playing/paused state, and volume
   - Query param: `voice_channel_id`

2. **POST `/api/queue/pause`** - Pause playback
   - Toggles pause state

3. **POST `/api/queue/play`** - Start/resume playback
   - Body: `{ voice_channel_id: string }`

4. **POST `/api/queue/skip`** - Skip current track

5. **POST `/api/queue/clear`** - Clear entire queue
   - Body: `{ voice_channel_id: string }`

6. **POST `/api/queue/remove`** - Remove specific track
   - Body: `{ voice_channel_id: string, position: number }`

### Router Updates (`internal/api/httpserver/router.go`)
- Registered all new queue endpoints under `/api/queue`

## Frontend Changes

### New Components
1. **`MusicPlayer.tsx`** - Main player component
   - Shows current track and queue
   - Player controls (play, pause, skip, clear)
   - Track actions (remove, open link)
   - Real-time updates every 2 seconds
   - Shows who added each track
   - Displays player state (playing/paused)

### New Hooks
1. **`use-queue.ts`** - Fetch queue data
   - Auto-refreshes every 2 seconds
   - Returns tracks, state, volume

2. **`use-queue-actions.ts`** - Queue operations
   - Mutations for pause, play, skip, clear, remove
   - Auto-invalidates queue cache on success

### New API Routes (Frontend Proxies)
- `/api/queue/get.ts` - Proxy GET queue
- `/api/queue/pause.ts` - Proxy pause
- `/api/queue/play.ts` - Proxy play
- `/api/queue/skip.ts` - Proxy skip
- `/api/queue/clear.ts` - Proxy clear queue
- `/api/queue/remove.ts` - Proxy remove track

### Dashboard Updates (`dashboard/index.tsx`)
Complete redesign with:
- **Left Sidebar:**
  - List of voice channels (no dropdown)
  - Click to select and view that channel's queue
  - Add to queue form for selected channel
  
- **Right Panel:**
  - Real-time music player for selected channel
  - Auto-selects first channel on load
  - Switches between channels instantly (no page load)

## Features Implemented

### Player Display
✅ Show current track playing  
✅ Show upcoming tracks in queue  
✅ Show who added each song  
✅ Show playing/paused state  
✅ Show volume level  

### Player Controls
✅ Play button  
✅ Pause button  
✅ Skip button  
✅ Clear queue button  

### Track Actions
✅ Remove track from queue  
✅ Open original link in new tab  

### Channel Management
✅ Display channels as list (not dropdown)  
✅ Click to select channel  
✅ Real-time switching between channels  
✅ Each channel shows its own queue  

### Real-Time Updates
✅ Queue refreshes every 2 seconds  
✅ No page reload when switching channels  
✅ Instant feedback on all actions  

## UI/UX Details
- Uses shadcn components throughout
- Lucide React icons for all actions
- Modern dark theme matching the app style
- Responsive layout (sidebar + main player)
- Loading states and error handling
- Success/error messages with auto-dismiss
- Hover effects and transitions

## Tech Stack
- **Backend:** Go, Chi Router
- **Frontend:** React, TanStack Router, TanStack Query
- **UI:** Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management:** React Query with auto-refresh

## Recent Features & Fixes (Oct 30, 2025)

### Feature: YouTube Metadata Display
**Implementation**: Added automatic fetching and display of YouTube video metadata.

**Backend Changes**:
- Created `GetVideoInfo()` function in `internal/media/get_video_info.go` that uses `yt-dlp --dump-json` to fetch video metadata
- Added `TrackInfo` struct to store: Title, Artist, Duration, Thumbnail, AddedBy info
- Implemented metadata caching system (`TrackMetadataCache`) to store fetched data per guild
- Metadata is fetched asynchronously when a track is added to avoid blocking
- Metadata is attached to `NowPlaying` state when a track starts playing

**Frontend Changes**:
- Updated `QueueTrack` interface to include `artist`, `duration`, and `thumbnail` fields
- Now Playing section displays:
  - Video title (e.g., "Drum Show - Twenty One Pilots") instead of URL
  - Artist/channel name below the title
  - Thumbnail image (20x20 for current track, 12x12 for queue)
  - Link icon (Lucide `Link`) to open the YouTube video
  - "Added by" user information
- Queue items show the same rich metadata
- Graceful fallback to URL if metadata isn't available yet

**User Experience**:
- When you add `https://www.youtube.com/watch?v=5dA094oAy-g`, the player shows:
  - "Now Playing" with a link icon
  - Title: "Drum Show - Twenty One Pilots"
  - Artist: "Twenty One Pilots" (or channel name)
  - Video thumbnail
  - Who added the track

## Previous Fixes (Oct 30, 2025)

### Issue 3: Player Shows "Nothing Playing" When Music is Actually Playing
**Problem**: Bot joins channel and plays music, but the web player shows "nothing playing" with an empty queue.
**Root Cause**: In `ProcessQueue`, the current song is removed from the queue array before it starts playing (line 36), so when the API reads the queue, the currently playing track is missing.
**Solution**: 
- Added new state map `NowPlaying` to track the currently playing track URL per guild
- Updated `ProcessQueue` to store the current track in `NowPlaying` before starting playback
- Modified `QueueGet()` API handler to return both:
  - Currently playing track (position 0) from `NowPlaying` map
  - Upcoming tracks (position 1+) from `Queue` array
- Updated `StopSong` to clear `NowPlaying` state
- Updated `ProcessQueue` to clear `NowPlaying` when queue is empty

Now the API correctly returns the full queue including what's currently playing!

## Previous Fixes (Oct 30, 2025)

### Issue 1: 405 Method Not Allowed Error
**Problem**: Frontend was calling `/api/queue/get` but the route didn't exist correctly.
**Solution**: Added GET handler to `/api/queue/index.ts` instead of creating a separate route file. TanStack Start API routes should use the same file with different HTTP methods.

### Issue 2: UI Flipping Between States
**Problem**: When no music was playing, UI flickered between "Loading player..." and "No queue data available".
**Solution**: 
- Updated `MusicPlayer.tsx` to only show loading on initial load (when `isLoading && !queue`)
- Provided default empty queue data when no data is available
- Changed status text to show "Nothing playing" when queue is empty
- Added `retry: 1` to `useQuery` to avoid excessive retry requests

### Frontend API Route Structure
All queue operations are proxied through frontend API routes:
- `/api/queue` (GET) - Get queue data
- `/api/queue` (POST) - Add track to queue
- `/api/queue/pause` (POST) - Pause playback
- `/api/queue/play` (POST) - Start/resume playback
- `/api/queue/skip` (POST) - Skip current track
- `/api/queue/clear` (POST) - Clear queue
- `/api/queue/remove` (POST) - Remove specific track

Each route file is located at `/api/queue/{action}/index.ts` format.

## Next Steps (Optional Enhancements)
1. ✅ ~~Store track metadata (title, artist, duration) instead of just URLs~~ - COMPLETED
2. ✅ ~~Store user info with each queue item to show "Added by"~~ - COMPLETED
3. Add drag-and-drop to reorder queue
4. Add search/history of previously played tracks
5. Add volume control slider in the UI
6. Add track progress bar showing elapsed time / total duration
7. Add playlist support
8. Add ability to search for songs directly from the dashboard (instead of needing URL)
9. Show better visual feedback when metadata is loading
10. Cache thumbnails or use a CDN proxy for better loading performance

