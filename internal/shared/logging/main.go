package logging

import (
	"log"

	"github.com/ekkolyth/ekko-bot/internal/shared/config"
)

// Simple logging utility with color support for terminal output, used across the bot.

func MessageCreate(username, message string) {
	log.Println(config.CLI_GREEN + "[MSG]" + username + ":" + config.CLI_RESET + message)
}

func InteractionCreate(username, command string, args string) {
	log.Println(config.CLI_CYAN + "[INT]" + config.CLI_BRIGHT_CYAN + username + ": " + config.CLI_CYAN + command + config.CLI_RESET + args)
}

func Error(message string) {
	log.Println(config.CLI_RED + "[FATAL]" + config.CLI_RESET + message)
}

func Fatal(message string, error error) {
	log.Fatal(config.CLI_RED + "[FATAL]" + config.CLI_RESET + message)
}

func Info(message string) {
	log.Println(config.CLI_BLUE + "[INFO]:" + config.CLI_RESET + message)
}

func Warning(message string) {
	log.Println(config.CLI_YELLOW + "[WARN]:" + config.CLI_RESET + message)
}

func Dgvoice(message string) {
	log.Println(config.CLI_RED + "[VOICE]: " + config.CLI_RESET + message)
}

func Api(message string) {
	log.Println(config.CLI_BRIGHT_CYAN + "[API]:" + config.CLI_RESET + message)
}
