package httpx

import (
	"github.com/ekkolyth/ekko-bot/internal/lua"
	luaLib "github.com/yuin/gopher-lua"
)

// IsValidURL validates a URL using embedded Lua scripts
// Returns true only for valid YouTube URLs (shorts are rejected)
func IsValidURL(input string) bool {
	script := lua.Get()
	if err := script.LoadScript("lua/scripts/validate_url/validate_url.lua"); err != nil {
		return false
	}

	results, err := script.CallLuaFunc("validate_url", "validate_url", 3, luaLib.LString(input))
	if err != nil {
		return false
	}

	ok := results[0] != luaLib.LFalse && results[0] != luaLib.LNil
	provider := ""
	if results[1].Type() != luaLib.LTNil {
		provider = results[1].String()
	}

	return ok && provider == "youtube"
}
