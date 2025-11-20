-- =============================
-- ERROR CODES
-- 4 = INVALID YOUTUBE URL FORMAT
-- 5 = SHORTS URL NOT ACCEPTED
-- =============================


-- validate you get a proper YouTube URL structure
local function validate_youtube_url(input_url)
    -- Trim
    input_url = input_url:match("^%s*(.-)%s*$")

    -- reject shorts immediately
    if input_url:match("^https?://%w*%.?youtube%.com/shorts/[%w%-]+") then
        return false, 5
    end

    -- /watch?v=VIDEO_ID (may have additional query parameters after &)
    if input_url:match("^https?://%w*%.?youtube%.com/watch%?v=") then
        local video_id = input_url:match("v=([%w%-]+)")
        if video_id and #video_id == 11 then
            return true, nil
        end
        return false, 4
    end

    -- /embed/VIDEO_ID
    if input_url:match("^https?://%w*%.?youtube%.com/embed/[%w%-]+$") then
        local video_id = input_url:match("embed/([%w%-]+)$")
        if video_id and #video_id == 11 then
            return true, nil
        end
        return false, 4
    end

    -- youtu.be/VIDEO_ID
    if input_url:match("^https?://youtu%.be/[%w%-]+") then
        local video_id = input_url:match("youtu%.be/([%w%-]+)")
        if video_id and #video_id == 11 then
            return true, nil
        end
        return false, 4
    end

    return false, 4
end


-- Normalize any valid YouTube URL
local function normalize_youtube_url(input_url)
    input_url = input_url:match("^%s*(.-)%s*$") -- trim

    local ok, err = validate_youtube_url(input_url)
    if not ok then
        return nil, err
    end

    -- =============================
    -- Normalize youtu.be shortlinks
    -- =============================
    local prefix = "youtu.be/"
    local pos = input_url:find(prefix, 1, true)

    if pos then
        local video_id = input_url:sub(pos + #prefix)

        local qpos = video_id:find("?", 1, true)
        if qpos then
            video_id = video_id:sub(1, qpos - 1)
        end

        input_url = "https://www.youtube.com/watch?v=" .. video_id
    end

    -- =============================
    -- Strip & parameters (handle both & and URL-encoded %26)
    -- =============================
    local and_pos = input_url:find("&", 1, true)
    if and_pos then
        input_url = input_url:sub(1, and_pos - 1)
    else
        -- Also check for URL-encoded & (%26)
        local encoded_and_pos = input_url:find("%26", 1, true)
        if encoded_and_pos then
            input_url = input_url:sub(1, encoded_and_pos - 1)
        end
    end

    return input_url, nil
end


return {
    normalize_youtube_url = normalize_youtube_url
}
