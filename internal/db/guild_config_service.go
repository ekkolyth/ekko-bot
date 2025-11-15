package db

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

var (
	// ErrGuildIDRequired indicates the guild id cannot be empty.
	ErrGuildIDRequired = errors.New("guild id is required")
	// ErrWelcomeChannelRequired indicates the channel id is required.
	ErrWelcomeChannelRequired = errors.New("welcome channel id is required")
	// ErrWelcomeMessageRequired indicates the welcome message cannot be blank.
	ErrWelcomeMessageRequired = errors.New("welcome message is required")
	// ErrWelcomeMessageTooLong indicates the welcome message exceeded the allowed length.
	ErrWelcomeMessageTooLong = errors.New("welcome message is too long")
)

const maxWelcomeMessageLength = 512

// GuildConfigService exposes helpers for guild configuration features.
type GuildConfigService struct {
	queries *Queries
}

// WelcomeSettings represents the saved welcome configuration.
type WelcomeSettings struct {
	GuildID   string
	ChannelID *string
	Message   *string
}

// NewGuildConfigService builds a GuildConfigService.
func NewGuildConfigService(queries *Queries) *GuildConfigService {
	return &GuildConfigService{queries: queries}
}

// GetWelcomeSettings reads the welcome configuration for a guild. Returns nil when unset.
func (s *GuildConfigService) GetWelcomeSettings(ctx context.Context, guildID string) (*WelcomeSettings, error) {
	id := strings.TrimSpace(guildID)
	if id == "" {
		return nil, ErrGuildIDRequired
	}

	row, err := s.queries.GetWelcomeConfig(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &WelcomeSettings{
		GuildID:   row.GuildID,
		ChannelID: row.WelcomeChannelID,
		Message:   row.WelcomeMessage,
	}, nil
}

// SaveWelcomeSettings upserts the desired welcome channel and message for a guild.
func (s *GuildConfigService) SaveWelcomeSettings(ctx context.Context, guildID, rawChannelID, rawMessage string) (*WelcomeSettings, error) {
	id := strings.TrimSpace(guildID)
	if id == "" {
		return nil, ErrGuildIDRequired
	}

	channelID := strings.TrimSpace(rawChannelID)
	if channelID == "" {
		return nil, ErrWelcomeChannelRequired
	}

	message := strings.TrimSpace(rawMessage)
	if message == "" {
		return nil, ErrWelcomeMessageRequired
	}
	if utf8.RuneCountInString(message) > maxWelcomeMessageLength {
		return nil, ErrWelcomeMessageTooLong
	}

	channelValue := channelID
	messageValue := message

	row, err := s.queries.UpsertWelcomeConfig(ctx, &UpsertWelcomeConfigParams{
		GuildID:          id,
		WelcomeChannelID: &channelValue,
		WelcomeMessage:   &messageValue,
	})
	if err != nil {
		return nil, err
	}

	return &WelcomeSettings{
		GuildID:   row.GuildID,
		ChannelID: row.WelcomeChannelID,
		Message:   row.WelcomeMessage,
	}, nil
}
