package discordutil

import (
	"os"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/constants"
	"github.com/ekkolyth/ekko-bot/internal/shared/logging"
	"github.com/ekkolyth/ekko-bot/internal/shared/state"

	"github.com/bwmarrin/discordgo"
)

func SetupSlashCommands(s *discordgo.Session) {
	logging.InfoLog(constants.ANSIBlue + "Setting up slash commands")
	var theNumberOneAsFloat float64 = 1.0

	commands := []*discordgo.ApplicationCommand{
		{Name: "ping", Description: "Replies with Pong"},
		{Name: "pong", Description: "Replies with Ping"},
		{Name: "play", Description: "Play a Youtube URL",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "url",
					Description: "The Youtube URL to play",
					Required:    true,
				},
			},
		},
		{Name: "search", Description: "Search for a song to play",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "query",
					Description: "The search query",
					Required:    true,
				},
			},
		},
		{Name: "skip", Description: "Skip the current song"},
		{Name: "queue", Description: "Show the current queue"},
		{Name: "stop", Description: "Stop playing and clear the queue"},
		{Name: "pause", Description: "Pause the current song"},
		{Name: "resume", Description: "Resume the current song"},
		{Name: "volume", Description: "Set the volume (0-200)",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionInteger,
					Name:        "level",
					Description: "The volume level (0-200)",
					Required:    false, // false since will default to showing current volume
				},
			},
		},
		{Name: "currentvolume", Description: "Show the current volume"},
		{Name: "nuke", Description: "Delete a number of messages",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionInteger,
					Name:        "count",
					Description: "The number of messages to delete (1-200)",
					Required:    true,
					MaxValue:    200.0,
					MinValue:    &theNumberOneAsFloat,
				},
			},
		},
		{Name: "uptime", Description: "Show the bot's uptime"},
		{Name: "version", Description: "Show the bot's version"},
		{Name: "help", Description: "Show help information"},
	}

	// Check if we should refresh commands (delete and recreate all)
	refreshCommands := strings.ToLower(os.Getenv("REFRESH_COMMANDS"))
	shouldRefresh := refreshCommands == "true" || refreshCommands == "1" || refreshCommands == "yes"

	existingCommands, err := s.ApplicationCommands(s.State.User.ID, "")
	if err != nil {
		logging.FatalLog("Could not fetch existing commands:" + err.Error())
	}

	if shouldRefresh {
		// Delete all existing commands to ensure they're up to date
		logging.InfoLog("REFRESH_COMMANDS enabled - deleting existing commands to refresh them...")
		for _, existingCmd := range existingCommands {
			err := s.ApplicationCommandDelete(s.State.User.ID, "", existingCmd.ID)
			if err != nil {
				logging.WarningLog("Could not delete command:" + existingCmd.Name + " " + err.Error())
			} else {
				logging.InfoLog("Deleted command: " + existingCmd.Name)
			}
		}

		// Register all commands fresh
		for _, cmd := range commands {
			if state.DisabledCommands[cmd.Name] {
				logging.WarningLog("Skipping disabled command:" + cmd.Name)
				continue
			}
			_, err := s.ApplicationCommandCreate(s.State.User.ID, "", cmd)
			if err != nil {
				logging.FatalLog("Could not create command:" + cmd.Name + " " + err.Error())
			} else {
				logging.InfoLog("Registered command: " + cmd.Name)
			}
		}
	} else {
		// Only register commands that don't exist yet (original behavior)
		logging.InfoLog("REFRESH_COMMANDS disabled - only registering missing commands...")
		for _, cmd := range commands {
			if state.DisabledCommands[cmd.Name] {
				logging.WarningLog("Skipping disabled command:" + cmd.Name)
				continue
			}
			found := false
			for _, existingCmd := range existingCommands {
				if cmd.Name == existingCmd.Name {
					found = true
					break
				}
			}
			if !found {
				_, err := s.ApplicationCommandCreate(s.State.User.ID, "", cmd)
				if err != nil {
					logging.FatalLog("Could not create command:" + cmd.Name + " " + err.Error())
				} else {
					logging.InfoLog("Registered command: " + cmd.Name)
				}
			}
		}
	}
	logging.InfoLog("Slash commands setup complete.")
}
