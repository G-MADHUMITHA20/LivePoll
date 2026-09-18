package api

import (
	"github.com/gin-gonic/gin"
	"github.com/internship/live-polling-tool/backend/internal/api/handlers"
	"github.com/internship/live-polling-tool/backend/internal/api/middleware"
)

func RegisterRoutes(r *gin.Engine, authHandler *handlers.AuthHandler, pollHandler *handlers.PollHandler, publicHandler *handlers.PublicHandler, realtimeHandler *handlers.RealtimeHandler, jwtSecret string, frontendURL string) {
	// Global Middlewares
	r.Use(middleware.CORSMiddleware(frontendURL))
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.RequestSizeLimit(2 * 1024 * 1024)) // 2MB Limit

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", handlers.HealthCheck)

		public := v1.Group("/public/polls")
		{
			public.GET("/:id", publicHandler.GetPublicPoll)
			public.POST("/:id/vote", middleware.RateLimit(2, 5), publicHandler.SubmitVote)
			public.GET("/:id/events", realtimeHandler.StreamEvents)
		}

		auth := v1.Group("/auth")
		{
			auth.POST("/signup", middleware.RateLimit(1, 3), authHandler.Signup)
			auth.POST("/login", middleware.RateLimit(2, 5), authHandler.Login)
			
			// Protected route
			auth.GET("/me", middleware.AuthMiddleware(jwtSecret), authHandler.GetMe)
		}

		polls := v1.Group("/polls")
		polls.Use(middleware.AuthMiddleware(jwtSecret))
		{
			polls.POST("", pollHandler.CreatePoll)
			polls.GET("", pollHandler.GetMyPolls)
			polls.GET("/:id", pollHandler.GetPoll)
			polls.PUT("/:id", pollHandler.UpdatePoll)
		}
	}
}
