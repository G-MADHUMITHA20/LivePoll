package repository

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis(uri string) (*redis.Client, error) {
	if uri == "" {
		uri = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(uri)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = client.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}

	log.Println("Connected to Redis!")
	return client, nil
}
