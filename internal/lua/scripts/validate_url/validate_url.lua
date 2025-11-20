-- ERROR CODES
-- =============================
-- 1 = EMPTY OR NIL INPUT
-- 2 = INVALID URL FORMAT (missing protocol or invalid structure)
-- 3 = UNSUPPORTED PROVIDER
-- =============================

local function validate_url(input_url)
    -- Empty input
    if not input_url or input_url == "" then
        return false, nil, 1
    end

    -- trim
    input_url = input_url:match("^%s*(.-)%s*$")

    -- =============================
    -- must start with http:// or https://
    -- =============================
    if not input_url:match("^https?://") then
        return false, nil, 2 -- error code 2: invalid URL format
    end

    -- =============================
    -- Identify provider
    -- =============================

    -- send to youtube
    if
        input_url:match("^https?://%w*%.?youtube%.com/")
        or input_url:match("^https?://youtu%.be/")
    then
        return true, "youtube", nil
    end

    -- send to spotify
    if input_url:match("^https?://open%.spotify%.com/") then
        return true, "spotify", nil
    end

    return false, nil, 3 -- error code 3: unsupported provider
end

return {
    validate_url = validate_url
}
