package db

import (
	"context"
)

// BotStatusService provides methods for bot status-related database operations
type BotStatusService struct {
	db *DB
}

// NewBotStatusService creates a new BotStatusService
func NewBotStatusService(db *DB) *BotStatusService {
	return &BotStatusService{db: db}
}

// SetBotActive sets the bot's active status
func (s *BotStatusService) SetBotActive(ctx context.Context, id string, isActive bool) (*BotState, error) {
	return s.db.Queries.UpdateBotActiveStatus(ctx, &UpdateBotActiveStatusParams{
		ID:       id,
		IsActive: isActive,
	})
}

// SetBotActivity sets the bot's activity message
func (s *BotStatusService) SetBotActivity(ctx context.Context, id string, activity *string) (*BotState, error) {
	return s.db.Queries.UpdateBotActivity(ctx, &UpdateBotActivityParams{
		ID:              id,
		CurrentActivity: activity,
	})
}

// GetActiveBotStatus gets the currently active bot status
func (s *BotStatusService) GetActiveBotStatus(ctx context.Context) (*BotState, error) {
	return s.db.Queries.GetActiveBotStatus(ctx)
}

// GetAllBotStatuses gets all bot statuses
func (s *BotStatusService) GetAllBotStatuses(ctx context.Context) ([]*BotState, error) {
	return s.db.Queries.ListAllBotStatuses(ctx)
}

// CreateBotStatus creates a new bot status entry
func (s *BotStatusService) CreateBotStatus(ctx context.Context, id string, isActive bool, activity *string) (*BotState, error) {
	return s.db.Queries.CreateBotStatus(ctx, &CreateBotStatusParams{
		ID:              id,
		IsActive:        isActive,
		CurrentActivity: activity,
	})
}

// DeleteBotStatus deletes a bot status entry
func (s *BotStatusService) DeleteBotStatus(ctx context.Context, id string) error {
	return s.db.Queries.DeleteBotStatus(ctx, id)
}
