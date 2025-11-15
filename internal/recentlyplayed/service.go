package recentlyplayed

import (
	stdcontext "context"
	"errors"

	"github.com/ekkolyth/ekko-bot/internal/db"
)

const maxRecentTracks = 100

// Service wraps database access for recently played tracks.
type Service struct {
	db *db.DB
}

// NewService constructs a recently played service.
func NewService(database *db.DB) *Service {
	return &Service{db: database}
}

var service *Service

// SetService wires the singleton service for shared use.
func SetService(s *Service) {
	service = s
}

// RecordParams captures the data needed to persist a recent track entry.
type RecordParams struct {
	GuildID         string
	VoiceChannelID  string
	URL             string
	Title           string
	Artist          string
	DurationSeconds int
	Thumbnail       string
	AddedBy         string
	AddedByID       string
}

// Record saves a recently played entry via the shared service.
func Record(ctx stdcontext.Context, params RecordParams) error {
	if service == nil {
		return errors.New("recently played service unavailable")
	}
	return service.Record(ctx, params)
}

// List fetches the most recent entries for a voice channel via the shared service.
func List(ctx stdcontext.Context, guildID, voiceChannelID string, limit int32) ([]*db.RecentlyPlayed, error) {
	if service == nil {
		return nil, errors.New("recently played service unavailable")
	}
	return service.List(ctx, guildID, voiceChannelID, limit)
}

// Record persists a new recently played entry and trims the list to the last 100 rows.
func (s *Service) Record(ctx stdcontext.Context, params RecordParams) error {
	if params.GuildID == "" || params.VoiceChannelID == "" || params.URL == "" {
		return errors.New("missing required recently played fields")
	}

	title := optionalString(params.Title)
	artist := optionalString(params.Artist)
	thumbnail := optionalString(params.Thumbnail)
	addedBy := optionalString(params.AddedBy)
	addedByID := optionalString(params.AddedByID)

	return s.db.WithTx(ctx, func(queries *db.Queries) error {
		if err := queries.InsertRecentlyPlayed(ctx, &db.InsertRecentlyPlayedParams{
			GuildID:         params.GuildID,
			VoiceChannelID:  params.VoiceChannelID,
			Url:             params.URL,
			Title:           title,
			Artist:          artist,
			DurationSeconds: int32(params.DurationSeconds),
			Thumbnail:       thumbnail,
			AddedBy:         addedBy,
			AddedByID:       addedByID,
		}); err != nil {
			return err
		}

		return queries.TrimRecentlyPlayed(ctx, &db.TrimRecentlyPlayedParams{
			GuildID:        params.GuildID,
			VoiceChannelID: params.VoiceChannelID,
			Offset:         maxRecentTracks,
		})
	})
}

// List returns a bounded slice of recently played entries ordered from newest to oldest.
func (s *Service) List(ctx stdcontext.Context, guildID, voiceChannelID string, limit int32) ([]*db.RecentlyPlayed, error) {
	if guildID == "" || voiceChannelID == "" {
		return nil, errors.New("missing required recently played filters")
	}

	if limit <= 0 || limit > maxRecentTracks {
		limit = maxRecentTracks
	}

	return s.db.Queries.ListRecentlyPlayed(ctx, &db.ListRecentlyPlayedParams{
		GuildID:        guildID,
		VoiceChannelID: voiceChannelID,
		Limit:          limit,
	})
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
