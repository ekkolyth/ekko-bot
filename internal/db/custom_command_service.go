package db

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	// ErrCustomCommandExists indicates that a command with the same name already exists.
	ErrCustomCommandExists = errors.New("custom command already exists")
	// ErrCustomCommandNotFound indicates that there is no command for the provided name.
	ErrCustomCommandNotFound = errors.New("custom command not found")
	// ErrCustomCommandNameRequired indicates that the command name was empty after validation.
	ErrCustomCommandNameRequired = errors.New("command name is required")
	// ErrCustomCommandResponseRequired indicates that the response content was empty after validation.
	ErrCustomCommandResponseRequired = errors.New("command response is required")
	// ErrCustomCommandIDRequired indicates that the command id input was empty.
	ErrCustomCommandIDRequired = errors.New("command id is required")
)

// CustomCommandService wraps sqlc queries for custom command access.
type CustomCommandService struct {
	queries *Queries
}

// NewCustomCommandService builds a CustomCommandService.
func NewCustomCommandService(queries *Queries) *CustomCommandService {
	return &CustomCommandService{queries: queries}
}

// List returns all commands for a guild ordered alphabetically.
func (s *CustomCommandService) List(ctx context.Context, guildID string) ([]*CustomCommand, error) {
	return s.queries.ListCustomCommands(ctx, guildID)
}

// GetByName finds a command by name using case-insensitive matching.
func (s *CustomCommandService) GetByName(ctx context.Context, guildID, rawName string) (*CustomCommand, error) {
	name := normalizeCommandName(rawName)
	if name == "" {
		return nil, ErrCustomCommandNameRequired
	}
	command, err := s.queries.GetCustomCommandByName(ctx, &GetCustomCommandByNameParams{
		GuildID: guildID,
		Name:    name,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCustomCommandNotFound
	}
	return command, err
}

// Create inserts a new command after validating uniqueness.
func (s *CustomCommandService) Create(ctx context.Context, guildID, rawName, rawResponse string) (*CustomCommand, error) {
	name := normalizeCommandName(rawName)
	if name == "" {
		return nil, ErrCustomCommandNameRequired
	}

	response := strings.TrimSpace(rawResponse)
	if response == "" {
		return nil, ErrCustomCommandResponseRequired
	}

	command, err := s.GetByName(ctx, guildID, name)
	if err != nil && !errors.Is(err, ErrCustomCommandNotFound) {
		return nil, err
	}
	if command != nil {
		return nil, ErrCustomCommandExists
	}

	return s.queries.CreateCustomCommand(ctx, &CreateCustomCommandParams{
		GuildID:  guildID,
		Name:     name,
		Response: response,
	})
}

// Update modifies an existing command's name and response.
func (s *CustomCommandService) Update(ctx context.Context, guildID, id, rawName, rawResponse string) (*CustomCommand, error) {
	trimmedID := strings.TrimSpace(id)
	if trimmedID == "" {
		return nil, ErrCustomCommandIDRequired
	}

	var identifier pgtype.UUID
	if err := identifier.Scan(trimmedID); err != nil {
		return nil, err
	}

	name := normalizeCommandName(rawName)
	if name == "" {
		return nil, ErrCustomCommandNameRequired
	}

	response := strings.TrimSpace(rawResponse)
	if response == "" {
		return nil, ErrCustomCommandResponseRequired
	}

	command, err := s.GetByName(ctx, guildID, name)
	if err != nil && !errors.Is(err, ErrCustomCommandNotFound) {
		return nil, err
	}

	if command != nil && command.ID.Bytes != identifier.Bytes {
		return nil, ErrCustomCommandExists
	}

	updated, err := s.queries.UpdateCustomCommand(ctx, &UpdateCustomCommandParams{
		GuildID:  guildID,
		ID:       identifier,
		Name:     name,
		Response: response,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCustomCommandNotFound
	}
	return updated, err
}

// Delete removes a command by id for the guild.
func (s *CustomCommandService) Delete(ctx context.Context, guildID, id string) error {
	trimmedID := strings.TrimSpace(id)
	if trimmedID == "" {
		return ErrCustomCommandIDRequired
	}

	var identifier pgtype.UUID
	if err := identifier.Scan(trimmedID); err != nil {
		return err
	}

	return s.queries.DeleteCustomCommand(ctx, &DeleteCustomCommandParams{
		GuildID: guildID,
		ID:      identifier,
	})
}

// normalizeCommandName trims whitespace and removes a leading bang if present.
func normalizeCommandName(raw string) string {
	trimmed := strings.TrimSpace(raw)
	trimmed = strings.TrimPrefix(trimmed, "!")
	return strings.TrimSpace(trimmed)
}
