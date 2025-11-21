package context

import (
	stdctx "context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// share state bewtween API and Bot
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

// set the shared store
func SetQueueStore(s QueueStore) {
	store = s
}

// return the shared store
func GetQueueStore() QueueStore {
	return store
}

type redisQueueStore struct {
	client *redis.Client
}

// return a Redis backed QueueStore
func NewRedisQueueStore(client *redis.Client) QueueStore {
	return &redisQueueStore{client: client}
}

// add track to end of queue
func (store *redisQueueStore) Append(queueKey string, track *TrackInfo) error {
	if track == nil {
		return errors.New("track is required")
	}

	payload, err := json.Marshal(track)
	if err != nil {
		return err
	}

	return store.client.RPush(stdctx.Background(), listKey(queueKey), payload).Err()
}

// return first track from queue
func (store *redisQueueStore) PopNext(queueKey string) (*TrackInfo, error) {
	result, err := store.client.LPop(stdctx.Background(), listKey(queueKey)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}

	return decodeTrack(result)
}

// return all tracks in queue in order
func (store *redisQueueStore) Snapshot(queueKey string) ([]*TrackInfo, error) {
	values, err := store.client.LRange(stdctx.Background(), listKey(queueKey), 0, -1).Result()
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

// remove track at index
func (store *redisQueueStore) Remove(queueKey string, index int) error {
	if index < 0 {
		return fmt.Errorf("invalid index %d", index)
	}

	ctx := stdctx.Background()
	values, err := store.client.LRange(ctx, listKey(queueKey), 0, -1).Result()
	if err != nil {
		return err
	}

	if index >= len(values) {
		return fmt.Errorf("index %d out of range", index)
	}

	updated := append([]string{}, values[:index]...)
	updated = append(updated, values[index+1:]...)

	pipe := store.client.TxPipeline()
	pipe.Del(ctx, listKey(queueKey))
	for _, val := range updated {
		pipe.RPush(ctx, listKey(queueKey), val)
	}
	_, execErr := pipe.Exec(ctx)
	return execErr
}

// clear queue
func (store *redisQueueStore) Clear(queueKey string) error {
	return store.client.Del(stdctx.Background(), listKey(queueKey)).Err()
}

// return queue length
func (store *redisQueueStore) Length(queueKey string) (int64, error) {
	return store.client.LLen(stdctx.Background(), listKey(queueKey)).Result()
}

// save metadata for url
func (store *redisQueueStore) SaveMetadata(queueKey, url string, info *TrackInfo) error {
	if info == nil {
		return errors.New("metadata track required")
	}
	payload, err := json.Marshal(info)
	if err != nil {
		return err
	}

	return store.client.HSet(stdctx.Background(), metadataKey(queueKey), url, payload).Err()
}

// return metadata for url
func (store *redisQueueStore) LookupMetadata(queueKey, url string) (*TrackInfo, error) {
	result, err := store.client.HGet(stdctx.Background(), metadataKey(queueKey), url).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}

	return decodeTrack(result)
}

// clear metadata
func (store *redisQueueStore) ClearMetadata(queueKey string) error {
	return store.client.Del(stdctx.Background(), metadataKey(queueKey)).Err()
}

// set now playing track
func (store *redisQueueStore) SetNowPlaying(queueKey string, info *TrackInfo) error {
	if info == nil {
		return store.client.Del(stdctx.Background(), nowPlayingKey(queueKey)).Err()
	}
	payload, err := json.Marshal(info)
	if err != nil {
		return err
	}
	return store.client.Set(stdctx.Background(), nowPlayingKey(queueKey), payload, 0).Err()
}

// return now playing track
func (store *redisQueueStore) GetNowPlaying(queueKey string) (*TrackInfo, error) {
	result, err := store.client.Get(stdctx.Background(), nowPlayingKey(queueKey)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}
	return decodeTrack(result)
}

// clear now playing
func (store *redisQueueStore) ClearNowPlaying(queueKey string) error {
	return store.client.Del(stdctx.Background(), nowPlayingKey(queueKey)).Err()
}

// set playing state
func (store *redisQueueStore) SetPlaying(queueKey string, value bool) error {
	return store.client.HSet(stdctx.Background(), metaKey(queueKey), "playing", boolString(value)).Err()
}

// return playing state
func (store *redisQueueStore) IsPlaying(queueKey string) (bool, error) {
	return store.readBool(metaKey(queueKey), "playing")
}

// set paused state
func (store *redisQueueStore) SetPaused(queueKey string, value bool) error {
	return store.client.HSet(stdctx.Background(), metaKey(queueKey), "paused", boolString(value)).Err()
}

// return paused state
func (store *redisQueueStore) IsPaused(queueKey string) (bool, error) {
	return store.readBool(metaKey(queueKey), "paused")
}

// set volume
func (store *redisQueueStore) SetVolume(queueKey string, value float64) error {
	return store.client.HSet(stdctx.Background(), metaKey(queueKey), "volume", fmt.Sprintf("%f", value)).Err()
}

// return volume
func (store *redisQueueStore) GetVolume(queueKey string) (float64, error) {
	result, err := store.client.HGet(stdctx.Background(), metaKey(queueKey), "volume").Result()
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

// return bool value from hash field
func (store *redisQueueStore) readBool(key, field string) (bool, error) {
	result, err := store.client.HGet(stdctx.Background(), key, field).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return false, nil
		}
		return false, err
	}
	return result == "1", nil
}

// convert bool to string
func boolString(value bool) string {
	if value {
		return "1"
	}
	return "0"
}

// return queue list key
func listKey(queueKey string) string {
	return "queue:list:" + queueKey
}

// return metadata key
func metadataKey(queueKey string) string {
	return "queue:metadata:" + queueKey
}

// return now playing key
func nowPlayingKey(queueKey string) string {
	return "queue:now:" + queueKey
}

// return meta key
func metaKey(queueKey string) string {
	return "queue:meta:" + queueKey
}

// decode track from json
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
