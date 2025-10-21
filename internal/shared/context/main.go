package context

import (
	"github.com/bwmarrin/discordgo"
)

type Context struct {
	SourceType           CommandSourceType // Where the command came from (i.e., interaction or message)
	Session              *discordgo.Session
	Interaction          *discordgo.InteractionCreate // Will be nil if not an interaction
	Message              *discordgo.MessageCreate     // Will be nil if not a message
	User                 *discordgo.User              // Caller of the command
	GuildID              string                       // Guild ID where the command was called
	ChannelID            string                       // Channel ID where the command was called
	ArgumentsRaw         map[string]any               // Raw arguments from the command, type depends on source
	Arguments            map[string]string            // Standardised arguments, types are consistent
	CommandName          string                       // Name of the command being executed, used for determining argument keys
	InteractionResponded bool                         // Whether the interaction has been responded to
}

type CommandSourceType int

const (
	SourceTypeUnknown     CommandSourceType = iota
	SourceTypeInteraction                   // Slash commands
	SourceTypeMessage                       // Text commands
)


// Getters

func (ctx *Context) GetSession() *discordgo.Session {
	return ctx.Session
}

func (ctx *Context) GetInteraction() *discordgo.InteractionCreate {
	return ctx.Interaction
}

func (ctx *Context) GetMessage() *discordgo.MessageCreate {
	return ctx.Message
}

func (ctx *Context) GetUser() *discordgo.User {
	return ctx.User
}

func (ctx *Context) GetGuildID() string {
	return ctx.GuildID
}

func (ctx *Context) GetChannelID() string {
	return ctx.ChannelID
}

func (ctx *Context) getArgumentRaw(key string) (any, bool) {
	val, exists := ctx.ArgumentsRaw[key]
	return val, exists
}

func (ctx *Context) GetSourceType() int {
	return int(ctx.SourceType)
}

// Setters

func (ctx *Context) Reply(message string) {
	if ctx.SourceType == SourceTypeInteraction && !ctx.InteractionResponded {
		ctx.Session.InteractionRespond(ctx.Interaction.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: message,
			},
		})
		ctx.InteractionResponded = true
		return
	} else {
		ctx.Session.ChannelMessageSend(ctx.ChannelID, message)
	}
}

func NewInteractionContext(s *discordgo.Session, i *discordgo.InteractionCreate) *Context {
	ctx := &Context{
		SourceType:           SourceTypeInteraction,
		Session:              s,
		Interaction:          i,
		User:                 i.User,
		GuildID:              i.GuildID,
		ChannelID:            i.ChannelID,
		ArgumentsRaw:         make(map[string]any),
		Arguments:            make(map[string]string),
		CommandName:          i.ApplicationCommandData().Name,
		InteractionResponded: false,
	}

	if data := i.ApplicationCommandData(); data.Name != "" {
		for _, option := range data.Options {
			ctx.ArgumentsRaw[option.Name] = option.Value
		}
	}
	if ctx.User == nil && i.Member != nil {
		ctx.User = i.Member.User
	}

	ctx.standardiseArguments()
	return ctx
}

func NewMessageContext(s *discordgo.Session, m *discordgo.MessageCreate) *Context {
	ctx := &Context{
		SourceType:           SourceTypeMessage,
		Session:              s,
		Message:              m,
		User:                 m.Author,
		ChannelID:            m.ChannelID,
		GuildID:              m.GuildID,
		ArgumentsRaw:         make(map[string]any),
		Arguments:            make(map[string]string),
		CommandName:          "",    // to be determined
		InteractionResponded: false, // not an interaction but keep for uniformity
	}
	ctx.determineCommandNameFromMessage()

	ctx.determineArgumentsFromMessage()

	ctx.standardiseArguments()
	return ctx

}
