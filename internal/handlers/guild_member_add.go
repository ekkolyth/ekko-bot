package handlers

import (
	"fmt"
	stdctx "context"
	"os"
	"strings"

	"github.com/bwmarrin/discordgo"
	appdb "github.com/ekkolyth/ekko-bot/internal/db"
	"github.com/ekkolyth/ekko-bot/internal/logging"
)

var guildConfigService *appdb.GuildConfigService

// SetGuildConfigService allows the bot handlers to read guild config.
func SetGuildConfigService(service *appdb.GuildConfigService) {
	guildConfigService = service
}

// HandleGuildMemberAdd posts the configured welcome embed when new members join.
func HandleGuildMemberAdd(session *discordgo.Session, event *discordgo.GuildMemberAdd) {
	if session == nil || event == nil || guildConfigService == nil {
		return
	}

	targetGuildID := os.Getenv("DISCORD_GUILD_ID")
	if targetGuildID == "" || event.GuildID != targetGuildID {
		return
	}

	settings, err := guildConfigService.GetWelcomeSettings(stdctx.Background(), targetGuildID)
	if err != nil {
		logging.Error("Failed to load welcome settings: " + err.Error())
		return
	}
	if settings == nil || settings.ChannelID == nil || settings.Message == nil {
		return
	}

	channelID := strings.TrimSpace(*settings.ChannelID)
	message := strings.TrimSpace(*settings.Message)
	if channelID == "" || message == "" {
		return
	}

	embed := buildWelcomeEmbed(session, event, message)
	if embed == nil {
		return
	}

	if _, err := session.ChannelMessageSendEmbed(channelID, embed); err != nil {
		logging.Error("Failed to send welcome embed: " + err.Error())
	}
}

func buildWelcomeEmbed(session *discordgo.Session, event *discordgo.GuildMemberAdd, message string) *discordgo.MessageEmbed {
	if session == nil || event == nil || event.User == nil {
		return nil
	}

	displayName := event.User.Username
	if event.Member != nil && event.Member.Nick != "" {
		displayName = event.Member.Nick
	}

	guildName := guildName(session, event.GuildID)

	mention := "<@" + event.User.ID + ">"
	description := strings.TrimSpace(message)
	if description == "" {
		description = "Welcome aboard!"
	}
	description += "\n\n" + mention

	avatarURL := userAvatarURL(event.User)

	return &discordgo.MessageEmbed{
		Title:       "Welcome to " + guildName,
		Description: description,
		Color:       0x8B5CF6,
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: avatarURL,
		},
		Author: &discordgo.MessageEmbedAuthor{
			Name:    displayName,
			IconURL: avatarURL,
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "We're glad you're here!",
		},
	}
}

func guildName(session *discordgo.Session, guildID string) string {
	if session == nil || guildID == "" {
		return "the server"
	}

	if stateGuild, err := session.State.Guild(guildID); err == nil && stateGuild != nil {
		if stateGuild.Name != "" {
			return stateGuild.Name
		}
	}

	if fetched, err := session.Guild(guildID); err == nil && fetched != nil && fetched.Name != "" {
		return fetched.Name
	}

	return "the server"
}

func userAvatarURL(user *discordgo.User) string {
	if user == nil {
		return ""
	}

	if url := user.AvatarURL("256"); url != "" {
		return url
	}

	discriminator := user.Discriminator
	index := 0
	if len(discriminator) > 0 {
		last := discriminator[len(discriminator)-1]
		if last >= '0' && last <= '9' {
			index = int(last - '0')
		}
	}

	return fmt.Sprintf("%sembed/avatars/%d.png", discordgo.EndpointCDN, index%5)
}
