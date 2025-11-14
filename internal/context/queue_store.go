package context

import (
	stdctx "context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// QueueStore abstracts queue persistence so both bot and API share state
type QueueStore interface {
	Append(queueKey string, track *TrackInfo) error
	PopNext(queueKey string) (*TrackInfo, error)
	Snapshot(queueKey string) ([]*TrackInfo, error)
	Remove(queueKey string, index int) error
	Clear(queueKey string) error
	Length(queueKey string) (int64, error)

	SaveMetadata(queueKey, url string, info *TrackInfo) error
	LookupMetadata(queueKey, url string) (*TrackInfo, error)
	ClearMetadata(queueKey string) error

	SetNowPlaying(queueKey string, info *TrackInfo) error
	GetNowPlaying(queueKey string) (*TrackInfo, error)
	ClearNowPlaying(queueKey string) error

	SetPlaying(queueKey string, value bool) error
	IsPlaying(queueKey string) (bool, error)
	SetPaused(queueKey string, value bool) error
	IsPaused(queueKey string) (bool, error)

	SetVolume(queueKey string, value float64) error
	GetVolume(queueKey string) (float64, error)
}

var store QueueStore

// SetQueueStore wires the shared store implementation
func SetQueueStore(s QueueStore) {
	store = s
}

// GetQueueStore returns the configured store
func GetQueueStore() QueueStore {
	return store
}

type redisQueueStore struct {
	client *redis.Client
}

// NewRedisQueueStore returns a Redis backed QueueStore
func NewRedisQueueStore(client *redis.Client) QueueStore {
	return &redisQueueStore{client: client}
}

func (s *redisQueueStore) Append(queueKey string, track *TrackInfo) error {
	if track == nil {
		return errors.New("track is required")
	}

	payload, err := json.Marshal(track)
	if err != nil {
		return err
	}

	return s.client.RPush(stdctx.Background(), listKey(queueKey), payload).Err()
}

func (s *redisQueueStore) PopNext(queueKey string) (*TrackInfo, error) {
	result, err := s.client.LPop(stdctx.Background(), listKey(queueKey)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}

	return decodeTrack(result)
}

func (s *redisQueueStore) Snapshot(queueKey string) ([]*TrackInfo, error) {
	values, err := s.client.LRange(stdctx.Background(), listKey(queueKey), 0, -1).Result()
	if err != nil {
		return nil, err
	}

	tracks := make([]*TrackInfo, 0, len(values))
	for _, raw := range values {
		track, decErr := decodeTrack(raw)
		if decErr != nil {
			return nil, decErr
		}
		tracks = append(tracks, track)
	}

	return tracks, nil
}

func (s *redisQueueStore) Remove(queueKey string, index int) error {
	if index < 0 {
		return fmt.Errorf("invalid index %d", index)
	}

	ctx := stdctx.Background()
	values, err := s.client.LRange(ctx, listKey(queueKey), 0, -1).Result()
	if err != nil {
		return err
	}

	if index >= len(values) {
		return fmt.Errorf("index %d out of range", index)
	}

	updated := append([]string{}, values[:index]...)
	updated = append(updated, values[index+1:]...)

	pipe := s.client.TxPipeline()
	pipe.Del(ctx, listKey(queueKey))
	for _, val := range updated {
		pipe.RPush(ctx, listKey(queueKey), val)
	}
	_, execErr := pipe.Exec(ctx)
	return execErr
}

func (s *redisQueueStore) Clear(queueKey string) error {
	return s.client.Del(stdctx.Background(), listKey(queueKey)).Err()
}

func (s *redisQueueStore) Length(queueKey string) (int64, error) {
	return s.client.LLen(stdctx.Background(), listKey(queueKey)).Result()
}

func (s *redisQueueStore) SaveMetadata(queueKey, url string, info *TrackInfo) error {
	if info == nil {
		return errors.New("metadata track required")
	}
	payload, err := json.Marshal(info)
	if err != nil {
		return err
	}

	return s.client.HSet(stdctx.Background(), metadataKey(queueKey), url, payload).Err()
}

func (s *redisQueueStore) LookupMetadata(queueKey, url string) (*TrackInfo, error) {
	result, err := s.client.HGet(stdctx.Background(), metadataKey(queueKey), url).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}

	return decodeTrack(result)
}

func (s *redisQueueStore) ClearMetadata(queueKey string) error {
	return s.client.Del(stdctx.Background(), metadataKey(queueKey)).Err()
}

func (s *redisQueueStore) SetNowPlaying(queueKey string, info *TrackInfo) error {
	if info == nil {
		return s.client.Del(stdctx.Background(), nowPlayingKey(queueKey)).Err()
	}
	payload, err := json.Marshal(info)
	if err != nil {
		return err
	}
	return s.client.Set(stdctx.Background(), nowPlayingKey(queueKey), payload, 0).Err()
}

func (s *redisQueueStore) GetNowPlaying(queueKey string) (*TrackInfo, error) {
	result, err := s.client.Get(stdctx.Background(), nowPlayingKey(queueKey)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return decodeTrack(result)
}

func (s *redisQueueStore) ClearNowPlaying(queueKey string) error {
	return s.client.Del(stdctx.Background(), nowPlayingKey(queueKey)).Err()
}

func (s *redisQueueStore) SetPlaying(queueKey string, value bool) error {
	return s.client.HSet(stdctx.Background(), metaKey(queueKey), "playing", boolString(value)).Err()
}

func (s *redisQueueStore) IsPlaying(queueKey string) (bool, error) {
	return s.readBool(metaKey(queueKey), "playing")
}

func (s *redisQueueStore) SetPaused(queueKey string, value bool) error {
	return s.client.HSet(stdctx.Background(), metaKey(queueKey), "paused", boolString(value)).Err()
}

func (s *redisQueueStore) IsPaused(queueKey string) (bool, error) {
	return s.readBool(metaKey(queueKey), "paused")
}

func (s *redisQueueStore) SetVolume(queueKey string, value float64) error {
	return s.client.HSet(stdctx.Background(), metaKey(queueKey), "volume", fmt.Sprintf("%f", value)).Err()
}

func (s *redisQueueStore) GetVolume(queueKey string) (float64, error) {
	result, err := s.client.HGet(stdctx.Background(), metaKey(queueKey), "volume").Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return 1.0, nil
		}
		return 0, err
	}

	parsed, parseErr := strconv.ParseFloat(result, 64)
	if parseErr != nil {
		return 1.0, nil
	}
	return parsed, nil
}

func (s *redisQueueStore) readBool(key, field string) (bool, error) {
	result, err := s.client.HGet(stdctx.Background(), key, field).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return false, nil
		}
		return false, err
	}
	return result == "1", nil
}

func boolString(value bool) string {
	if value {
		return "1"
	}
	return "0"
}

func listKey(queueKey string) string {
	return "queue:list:" + queueKey
}

func metadataKey(queueKey string) string {
	return "queue:metadata:" + queueKey
}

func nowPlayingKey(queueKey string) string {
	return "queue:now:" + queueKey
}

func metaKey(queueKey string) string {
	return "queue:meta:" + queueKey
}

func decodeTrack(payload string) (*TrackInfo, error) {
	if payload == "" {
		return nil, errors.New("empty track payload")
	}
	var track TrackInfo
	if err := json.Unmarshal([]byte(payload), &track); err != nil {
		return nil, err
	}
	return &track, nil
}
