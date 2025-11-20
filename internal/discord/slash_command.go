package discord

import (
	"os"
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"

	"github.com/bwmarrin/discordgo"
)

func SetupSlashCommands(s *discordgo.Session) {
	logging.Info("Setting up slash commands")
	var minValueAddr float64 = 1.0

	commands := []*discordgo.ApplicationCommand{
		{Name: "ping", Description: "Replies with Pong"},
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
					Description: "The current volume level (0-200)",
					Required:    false,
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
					MinValue:    &minValueAddr,
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

	// Get guild ID from environment (1 app instance = 1 guild)
	guildID := os.Getenv("DISCORD_GUILD_ID")

	existingCommands, err := s.ApplicationCommands(s.State.User.ID, "")
	if err != nil {
		logging.Fatal("Could not fetch existing commands", err)
	}

	if shouldRefresh {
		// Delete all existing global commands to ensure they're up to date
		logging.Info("REFRESH_COMMANDS enabled - deleting existing global commands to refresh them...")
		for _, existingCmd := range existingCommands {
			err := s.ApplicationCommandDelete(s.State.User.ID, "", existingCmd.ID)
			if err != nil {
				logging.Warning("Could not delete global command:" + existingCmd.Name + " " + err.Error())
			} else {
				logging.Info("Deleted global command: " + existingCmd.Name)
			}
		}

		// Also delete guild-specific commands if guild ID is set
		if guildID != "" {
			logging.Info("Deleting guild-specific commands for guild: " + guildID)
			guildCommands, guildErr := s.ApplicationCommands(s.State.User.ID, guildID)
			if guildErr != nil {
				logging.Warning("Could not fetch guild commands: " + guildErr.Error())
			} else {
				for _, existingCmd := range guildCommands {
					err := s.ApplicationCommandDelete(s.State.User.ID, guildID, existingCmd.ID)
					if err != nil {
						logging.Warning("Could not delete guild command:" + existingCmd.Name + " " + err.Error())
					} else {
						logging.Info("Deleted guild command: " + existingCmd.Name)
					}
				}
			}
		}

		// Register all commands fresh (as global commands)
		for _, cmd := range commands {
			if context.DisabledCommands[cmd.Name] {
				logging.Warning("Skipping disabled command:" + cmd.Name)
				continue
			}
			_, err := s.ApplicationCommandCreate(s.State.User.ID, "", cmd)
			if err != nil {
				logging.Fatal("Could not create command: "+cmd.Name, err)
			} else {
				logging.Info("Registered command: " + cmd.Name)
			}
		}
	} else {
		// Only register commands that don't exist yet (original behavior)
		logging.Info("REFRESH_COMMANDS disabled - only registering missing commands...")
		for _, cmd := range commands {
			if context.DisabledCommands[cmd.Name] {
				logging.Warning("Skipping disabled command:" + cmd.Name)
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
					logging.Fatal("Could not create command: "+cmd.Name, err)
				} else {
					logging.Info("Registered command: " + cmd.Name)
				}
			}
		}
	}
	logging.Info("Slash commands setup complete.")
}
