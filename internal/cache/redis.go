package cache

import (
	stdctx "context"
	"fmt"
	"os"
	"sync"

	"github.com/redis/go-redis/v9"
)

var (
	redisClient *redis.Client
	redisOnce   sync.Once
)

// InitRedis creates the shared Redis client using env configuration
func InitRedis() (*redis.Client, error) {
	var initErr error

	redisOnce.Do(func() {
		url := os.Getenv("REDIS_URL")
		if url == "" {
			initErr = fmt.Errorf("REDIS_URL is required")
			return
		}

		options, err := redis.ParseURL(url)
		if err != nil {
			options = &redis.Options{Addr: url}
		}

		if user := os.Getenv("REDIS_USERNAME"); user != "" {
			options.Username = user
		}

		if pass := os.Getenv("REDIS_PASSWORD"); pass != "" {
			options.Password = pass
		}

		client := redis.NewClient(options)
		if pingErr := client.Ping(stdctx.Background()).Err(); pingErr != nil {
			initErr = pingErr
			return
		}

		redisClient = client
	})

	if initErr != nil {
		return nil, initErr
	}

	return redisClient, nil
}

// GetRedis returns the initialized client if available
func GetRedis() *redis.Client {
	return redisClient
}

// CloseRedis shuts down the client
func CloseRedis(ctx stdctx.Context) error {
	if redisClient == nil {
		return nil
	}

	return redisClient.Close()
}

