package context

import (
	"strconv"
	"strings"
)


func (ctx *Context) ArgumentstoString() string {
	// this is for logging to stdout
	var output string
	for key, value := range ctx.Arguments {
		if value != "" {
			output += " " + key + "=" + value
		}
	}
	return output
}

// Convert raw arguments to standard types (not sanitised)
func (ctx *Context) standardiseArguments() {
	switch ctx.CommandName {
case "play": // url string (also support old "song" parameter name)
    var urlValue string
    // Try "url" first (new format), then "song" (old format)
    if val, exists := ctx.getArgumentRaw("url"); exists {
        if strVal, ok := val.(string); ok {
            urlValue = strings.TrimSpace(strVal)
        }
    } else if val, exists := ctx.getArgumentRaw("song"); exists {
        // Support old command format that used "song" parameter
        if strVal, ok := val.(string); ok {
            urlValue = strings.TrimSpace(strVal)
        }
    }
    // Strip any leading "/play " prefix that Discord might include
    if strings.HasPrefix(urlValue, "/play ") {
        urlValue = strings.TrimPrefix(urlValue, "/play ")
    }
    ctx.Arguments["url"] = strings.TrimSpace(urlValue)
	case "search": // query string
		if val, exists := ctx.getArgumentRaw("query"); exists {
			if strVal, ok := val.(string); ok {
				ctx.Arguments["query"] = strVal
			} else {
				ctx.Arguments["query"] = ""
			}
		} else {
			ctx.Arguments["query"] = ""
		}

	case "volume": // level int (0-200)
		if val, exists := ctx.getArgumentRaw("level"); exists {
			switch v := val.(type) {
			case int:
				ctx.Arguments["level"] = strconv.Itoa(v)
			case float64:
				ctx.Arguments["level"] = strconv.Itoa(int(v))
			case string:
				ctx.Arguments["level"] = strings.TrimSpace(v)
			default:
				ctx.Arguments["level"] = ""
			}

		} else {
			ctx.Arguments["level"] = ""
		}
	case "nuke": // count int (1-100)
		if val, exists := ctx.getArgumentRaw("count"); exists {
			switch v := val.(type) {
			case int:
				ctx.Arguments["count"] = strconv.Itoa(v)
			case float64:
				ctx.Arguments["count"] = strconv.Itoa(int(v))
			case string:
				ctx.Arguments["count"] = strings.TrimSpace(v)
			default:
				ctx.Arguments["count"] = ""
			}

		} else {
			ctx.Arguments["count"] = ""
		}
	}

}

func (ctx *Context) determineCommandNameFromMessage() {
	command := strings.Fields(ctx.GetMessage().Content)[0]
	if len(command) > 0 && command[0] == '!' {
		ctx.CommandName = command[1:]
		return
	}
	ctx.CommandName = ""
}


func (ctx *Context) determineArgumentsFromMessage() {
	// presume not sanitised
	switch ctx.CommandName {
	case "play":
		// everything after !play is the url
		if len(ctx.Message.Content) > 6 {
			ctx.ArgumentsRaw["url"] = ctx.Message.Content[6:]
		} else {
			ctx.ArgumentsRaw["url"] = ""
		}
	case "search":
		if len(ctx.Message.Content) > 8 {
			ctx.ArgumentsRaw["query"] = ctx.Message.Content[8:]
		} else {
			ctx.ArgumentsRaw["query"] = ""
		}
	case "volume":
		if len(ctx.Message.Content) > 8 {
			ctx.ArgumentsRaw["level"] = ctx.Message.Content[8:]
		} else {
			ctx.ArgumentsRaw["level"] = ""
		}
	case "nuke":
		if len(ctx.Message.Content) > 6 {
			ctx.ArgumentsRaw["count"] = ctx.Message.Content[6:]
		} else {
			ctx.ArgumentsRaw["count"] = ""
		}
	default:
		// No arguments to parse for other commands
	}
}
