package handlers

import (
	"strings"

	"github.com/ekkolyth/ekko-bot/internal/logging"
	"github.com/ekkolyth/ekko-bot/internal/state"

	"github.com/bwmarrin/discordgo"
)

func HandleMessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {

	logging.MessageCreateLog(m.Author.Username, m.Content)

	if m.Author.Bot || !strings.HasPrefix(m.Content, "!") { // ignore bot messages and messages not starting with '!'
		return
	}

	ctx := state.NewMessageContext(s, m)

	commandSelector(ctx)
}
