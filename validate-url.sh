#!/bin/sh

# Examples:
# https://www.youtube.com/watch?v=xHimP0uwink&list=RDxHimP0uwink&start_radio=1
# cl
# https://youtu.be/xHimP0uwink?si=tncqyq1dbKJf8Nev
# https://music.youtube.com/watch?v=xHimP0uwink

inputurl="$1"

# if no url, exit
if [ -z "$inputurl" ]; then
    exit 1
fi

video_id=""

# 1) youtu.be links — ID is in the path after "youtu.be/"
if echo "$inputurl" | grep -q "youtu.be/"; then
    # get everything after "youtu.be/"
    video_id="${inputurl#*youtu.be/}"
    # strip query, extra params, or fragment if present
    video_id="${video_id%%\?*}"
    video_id="${video_id%%&*}"
    video_id="${video_id%%#*}"

# 2) music.youtube.com links — ID is in v= query param
elif echo "$inputurl" | grep -q "music.youtube.com"; then
    # get everything after "v="
    video_id="${inputurl#*v=}"
    # strip everything after '&' or '#'
    video_id="${video_id%%&*}"
    video_id="${video_id%%#*}"

# 3) Regular youtube.com/watch links — same v= logic
elif echo "$inputurl" | grep -q "youtube.com/watch"; then
    # Get everything after "v="
    video_id="${inputurl#*v=}"
    # Strip everything after '&' or '#'
    video_id="${video_id%%&*}"
    video_id="${video_id%%#*}"
else
    # Unknown format, bail
    exit 1
fi

# If we somehow didn't get an ID, bail
if [ -z "$video_id" ]; then
    exit 1
fi

# canonical output
echo "https://www.youtube.com/watch?v=$video_id"
