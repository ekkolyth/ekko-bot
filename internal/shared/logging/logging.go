package logging

import (
	"log"

	"github.com/ekkolyth/ekko-bot/internal/shared/config"
)

// Simple logging utility with color support for terminal output, used across the bot.

func MessageCreateLog(username, message string) {
	log.Println(config.CLI_GREEN + "[MSG]" + username + ": " + message + config.CLI_RESET)
}

func InteractionCreateLog(username, command string, args string) {
	log.Println(config.CLI_CYAN + "[INT]" + username + ": " + command + args + config.CLI_RESET)
}

func ErrorLog(message string) {
	log.Println(config.CLI_RED + "[FATAL]" + config.CLI_RESET + message)
}

func FatalLog(message string, error error) {
	log.Fatal(config.CLI_RED + "[FATAL]" + config.CLI_RESET + message)
}

func InfoLog(message string) {
	log.Println(config.CLI_BLUE + "[INFO]:" + config.CLI_RESET + message)
}

func WarningLog(message string) {
	log.Println(config.CLI_YELLOW + "[WARN]:" + config.CLI_RESET + message)
}

func DgvoiceLog(message string) {
	log.Println(config.CLI_RED + "[VOICE]: " + config.CLI_RESET + message)
}

func ApiLog(message string) {
	log.Println(config.CLI_BRIGHT_CYAN + "[API]:" + config.CLI_RESET + message)
}
