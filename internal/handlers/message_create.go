package handlers

import (
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/context"
	"github.com/ekkolyth/ekko-bot/internal/logging"

	"github.com/bwmarrin/discordgo"
)

func HandleMessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {

	logging.MessageCreate(m.Author.Username, m.Content)

	if m.Author.Bot || !strings.HasPrefix(m.Content, "!") { // ignore bot messages and messages not starting with '!'
		return
	}

	ctx := context.NewMessageContext(s, m)

	CommandSelector(ctx)
}
