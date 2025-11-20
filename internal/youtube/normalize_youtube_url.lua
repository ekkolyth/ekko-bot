-- helper - validate that a URL is a valid YouTube format
local function isValidYouTubeURL(inputURL)
    if not inputURL or inputURL == "" then
        return false
    end

    if inputURL:match("^https?://%w*%.?youtube%.com/shorts/[%w%-]+") then
        return false
    end

    -- watch URL: youtube.com/watch?v=VIDEO_ID
    if inputURL:match("^https?://%w*%.?youtube%.com/watch%?v=[%w%-]+") then
        local id = inputURL:match("v=([%w%-]+)")
        return id ~= nil and #id == 11
    end

    -- embed URL: youtube.com/embed/VIDEO_ID
    if inputURL:match("^https?://%w*%.?youtube%.com/embed/[%w%-]+$") then
        local id = inputURL:match("embed/([%w%-]+)$")
        return id ~= nil and #id == 11
    end

    -- youtu.be short link
    if inputURL:match("^https?://youtu%.be/[%w%-]+") then
        local id = inputURL:match("youtu%.be/([%w%-]+)")
        return id ~= nil and #id == 11
    end

    return false
end


-- helper: string everything after &
local function stripAfterDelimiter(url, delimiter)
    local index = url:find(delimiter, 1, true)
    if index then
        return url:sub(1, index - 1)
    end
    return url
end


-- MAIN: normalize YouTube URLs
local function normalizeYouTubeURL(inputURL)
    if not isValidYouTubeURL(inputURL) then
        return nil
    end

    if not inputURL or inputURL == "" then
        return nil
    end

    -- Handle youtu.be short links
    local shortURL = "youtu.be/"
    local index = inputURL:find(shortURL, 1, true)

    if index then
        local videoID = inputURL:sub(index + #shortURL)

        local q = videoID:find("?", 1, true)
        if q then
            videoID = videoID:sub(1, q - 1)
        end

        inputURL = "https://www.youtube.com/watch?v=" .. videoID
    end

    -- strip everything after first "&"
    inputURL = stripAfterDelimiter(inputURL, "&")

    return inputURL
end


return {
    isValidYouTubeURL = isValidYouTubeURL,
    normalizeYouTubeURL = normalizeYouTubeURL,
}
