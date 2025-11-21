package handlers

import (
	stdctx "context"
	"fmt"
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
	if session == nil || event == nil {
		logging.Warning("HandleGuildMemberAdd: session or event is nil")
		return
	}

	if guildConfigService == nil {
		logging.Warning("HandleGuildMemberAdd: guildConfigService is nil")
		return
	}

	userID := ""
	if event.User != nil {
		userID = event.User.ID
	}
	logging.Info("Member joined: userID=%s, guildID=%s", userID, event.GuildID)

	targetGuildID := os.Getenv("DISCORD_GUILD_ID")
	if targetGuildID == "" {
		logging.Warning("HandleGuildMemberAdd: DISCORD_GUILD_ID environment variable is not set")
		return
	}

	if event.GuildID != targetGuildID {
		logging.Info("HandleGuildMemberAdd: guild ID mismatch (expected=%s, got=%s), ignoring", targetGuildID, event.GuildID)
		return
	}

	settings, err := guildConfigService.GetWelcomeSettings(stdctx.Background(), targetGuildID)
	if err != nil {
		logging.Warning("Failed to load welcome settings: " + err.Error())
		return
	}

	if settings == nil {
		logging.Info("HandleGuildMemberAdd: welcome settings not configured for guild %s", targetGuildID)
		return
	}

	if settings.ChannelID == nil || settings.Message == nil {
		logging.Info("HandleGuildMemberAdd: welcome settings incomplete (channelID or message is nil)")
		return
	}

	channelID := strings.TrimSpace(*settings.ChannelID)
	message := strings.TrimSpace(*settings.Message)
	if channelID == "" || message == "" {
		logging.Info("HandleGuildMemberAdd: welcome settings incomplete (channelID or message is empty)")
		return
	}

	// Validate channel exists and bot has permissions
	channel, err := session.Channel(channelID)
	if err != nil {
		logging.Warning(fmt.Sprintf("HandleGuildMemberAdd: failed to fetch channel %s: %s", channelID, err.Error()))
		return
	}

	if channel == nil {
		logging.Warning(fmt.Sprintf("HandleGuildMemberAdd: channel %s not found", channelID))
		return
	}

	// Check bot permissions in the channel
	permissions, err := session.UserChannelPermissions(session.State.User.ID, channelID)
	if err != nil {
		logging.Warning(fmt.Sprintf("HandleGuildMemberAdd: failed to check permissions for channel %s: %s", channelID, err.Error()))
		return
	}

	requiredPerms := int64(discordgo.PermissionSendMessages | discordgo.PermissionEmbedLinks)
	if permissions&requiredPerms != requiredPerms {
		logging.Warning(fmt.Sprintf("HandleGuildMemberAdd: bot missing required permissions in channel %s (has=0x%x, need=0x%x)", channelID, permissions, requiredPerms))
		return
	}

	embedTitle := ""
	if settings.EmbedTitle != nil {
		embedTitle = *settings.EmbedTitle
	}

	embed := buildWelcomeEmbed(session, event, message, embedTitle)
	if embed == nil {
		logging.Warning("HandleGuildMemberAdd: failed to build welcome embed")
		return
	}

	if _, err := session.ChannelMessageSendEmbed(channelID, embed); err != nil {
		logging.Warning(fmt.Sprintf("Failed to send welcome embed to channel %s: %s", channelID, err.Error()))
		return
	}

	logging.Info("Welcome message sent successfully: userID=%s, channelID=%s", userID, channelID)
}

func buildWelcomeEmbed(session *discordgo.Session, event *discordgo.GuildMemberAdd, message string, embedTitle string) *discordgo.MessageEmbed {
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

	// Use custom title if provided, otherwise default
	title := embedTitle
	if title == "" {
		title = "Welcome to " + guildName
	}

	return &discordgo.MessageEmbed{
		Title:       title,
		Description: description,
		Color:       0x8B5CF6,
		Image: &discordgo.MessageEmbedImage{
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
