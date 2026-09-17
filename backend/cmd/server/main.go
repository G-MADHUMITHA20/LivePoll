package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/internship/live-polling-tool/backend/internal/api"
	"github.com/internship/live-polling-tool/backend/internal/api/handlers"
	"github.com/internship/live-polling-tool/backend/internal/config"
	"github.com/internship/live-polling-tool/backend/internal/repository"
	"github.com/internship/live-polling-tool/backend/internal/service"
)

func main() {
	cfg := config.Load()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize DB
	dbClient, err := repository.InitMongoDB(cfg.MongoURI)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	db := dbClient.Database("live_polling")

	// Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	pollRepo := repository.NewPollRepository(db)
	voteRepo := repository.NewVoteRepository(db)

	redisClient, err := repository.InitRedis(cfg.RedisURI)
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis, realtime functionality will not work: %v", err)
	}

	// Initialize Services
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	pollService := service.NewPollService(pollRepo)
	voteService := service.NewVoteService(voteRepo, pollRepo, redisClient)

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService)
	pollHandler := handlers.NewPollHandler(pollService)
	publicHandler := handlers.NewPublicHandler(voteService)
	realtimeHandler := handlers.NewRealtimeHandler(voteService)

	r := gin.Default()

	// Register Routes
	api.RegisterRoutes(r, authHandler, pollHandler, publicHandler, realtimeHandler, cfg.JWTSecret)

	log.Printf("Server starting on port %s...", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
