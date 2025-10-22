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
func (s *BotStatusService) SetBotActive(ctx context.Context, id string, isActive bool) (*BotStatus, error) {
	return s.db.UpdateBotActiveStatus(ctx, &UpdateBotActiveStatusParams{
		ID:       id,
		IsActive: isActive,
	})
}

// SetBotActivity sets the bot's activity message
func (s *BotStatusService) SetBotActivity(ctx context.Context, id string, activity *string) (*BotStatus, error) {
	return s.db.UpdateBotActivity(ctx, &UpdateBotActivityParams{
		ID:       id,
		Activity: activity,
	})
}

// GetActiveBotStatus gets the currently active bot status
func (s *BotStatusService) GetActiveBotStatus(ctx context.Context) (*BotStatus, error) {
	return s.db.GetActiveBotStatus(ctx)
}

// GetAllBotStatuses gets all bot statuses
func (s *BotStatusService) GetAllBotStatuses(ctx context.Context) ([]*BotStatus, error) {
	return s.db.ListAllBotStatuses(ctx)
}

// CreateBotStatus creates a new bot status entry
func (s *BotStatusService) CreateBotStatus(ctx context.Context, id string, isActive bool, activity *string) (*BotStatus, error) {
	return s.db.CreateBotStatus(ctx, &CreateBotStatusParams{
		ID:       id,
		IsActive: isActive,
		Activity: activity,
	})
}

// DeleteBotStatus deletes a bot status entry
func (s *BotStatusService) DeleteBotStatus(ctx context.Context, id string) error {
	return s.db.DeleteBotStatus(ctx, id)
}
