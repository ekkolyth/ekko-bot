package internal

import "embed"

//go:embed lua/scripts/validate_url/*.lua
var LuaScripts embed.FS

