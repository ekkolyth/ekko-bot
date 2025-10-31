package httpx

import (
	"regexp"
	"strings"
)

// ValidDiscordSnowflake checks if a string is a valid Discord snowflake ID
// Discord snowflakes are numeric strings, typically 17-19 digits long
// They cannot be empty, "_", or contain non-numeric characters
func ValidDiscordSnowflake(id string) bool {
	id = strings.TrimSpace(id)
	
	// Cannot be empty or placeholder
	if id == "" || id == "_" {
		return false
	}
	
	// Must be purely numeric, 17-19 digits (Discord snowflake format)
	// Using regex to ensure it's all digits
	snowflakeRe := regexp.MustCompile(`^\d{17,19}$`)
	return snowflakeRe.MatchString(id)
}

