package lua

import (
	"fmt"
	"strings"
	"sync"

	"github.com/ekkolyth/ekko-bot/internal"
	lua "github.com/yuin/gopher-lua"
)

var (
	scriptInstance *Script
	scriptOnce     sync.Once
	scriptInitErr  error
)

type scriptLoader struct {
	once sync.Once
	err  error
}

var (
	scriptLoaders = make(map[string]*scriptLoader)
	loadersMutex  sync.Mutex
)

type Script struct {
	State *lua.LState
}

// initialize the global lua script state
func Init() error {
	scriptOnce.Do(func() {
		L := lua.NewState()
		scriptInstance = &Script{State: L}
	})
	return scriptInitErr
}

// get the global lua script instance (must call Init first)
func Get() *Script {
	if scriptInstance == nil {
		panic("Lua script not initialized. Call lua.Init() first")
	}
	return scriptInstance
}

// close the lua state and reset the instance
func Close() {
	if scriptInstance != nil && scriptInstance.State != nil {
		scriptInstance.State.Close()
		scriptInstance = nil
	}
}

// load a lua script from the embedded filesystem on first use
func (script *Script) LoadScript(scriptPath string) error {
	loadersMutex.Lock()
	loader, exists := scriptLoaders[scriptPath]
	if !exists {
		loader = &scriptLoader{}
		scriptLoaders[scriptPath] = loader
	}
	loadersMutex.Unlock()

	loader.once.Do(func() {
		scriptContent, err := internal.LuaScripts.ReadFile(scriptPath)
		if err != nil {
			loader.err = fmt.Errorf("failed to read %s: %w", scriptPath, err)
			return
		}

		// wrap script so its return value becomes a global module
		// extract module name from script path (e.g. ".../validate_youtube_url.lua" -> "validate_youtube_url")
		moduleName := extractModuleName(scriptPath)
		wrappedScript := fmt.Sprintf("local _module = (function()\n%s\nend)(); %s = _module", string(scriptContent), moduleName)

		if err := script.State.DoString(wrappedScript); err != nil {
			loader.err = fmt.Errorf("failed to load %s: %w", scriptPath, err)
			return
		}
	})

	return loader.err
}

// extract module name from script path
// example: "lua/scripts/validate_url/validate_youtube_url.lua" -> "validate_youtube_url"
func extractModuleName(scriptPath string) string {
	parts := strings.Split(scriptPath, "/")
	filename := parts[len(parts)-1]
	return strings.TrimSuffix(filename, ".lua")
}

// call a lua function and return its values
// numReturns specifies how many values to read back
func (script *Script) CallLuaFunc(moduleName, funcName string, numReturns int, args ...lua.LValue) ([]lua.LValue, error) {
	mod := script.State.GetGlobal(moduleName)
	if mod == nil || mod.Type() != lua.LTTable {
		return nil, fmt.Errorf("module %s not found", moduleName)
	}

	fn := script.State.GetField(mod, funcName)
	if fn.Type() != lua.LTFunction {
		return nil, fmt.Errorf("function %s.%s not found", moduleName, funcName)
	}

	script.State.Push(fn)
	for _, arg := range args {
		script.State.Push(arg)
	}

	if err := script.State.PCall(len(args), numReturns, nil); err != nil {
		return nil, err
	}

	results := make([]lua.LValue, numReturns)
	for i := 0; i < numReturns; i++ {
		results[numReturns-1-i] = script.State.Get(-1-i)
	}
	script.State.Pop(numReturns)

	return results, nil
}
