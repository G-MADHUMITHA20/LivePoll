package handlers

import (
	"io"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/internship/live-polling-tool/backend/internal/service"
	"github.com/redis/go-redis/v9"
)

type RealtimeHandler struct {
	voteService service.VoteService
}

func NewRealtimeHandler(voteService service.VoteService) *RealtimeHandler {
	return &RealtimeHandler{
		voteService: voteService,
	}
}

func (h *RealtimeHandler) StreamEvents(c *gin.Context) {
	pollID := c.Param("id")

	// 1. Validate poll exists
	_, err := h.voteService.GetPublicPoll(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(404, gin.H{"error": "poll not found"})
		return
	}

	// 2. Set headers for SSE
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	// 3. Subscribe to Redis
	pubsub := h.voteService.Subscribe(c.Request.Context(), pollID)
	var ch <-chan *redis.Message
	if pubsub != nil {
		defer pubsub.Close()
		ch = pubsub.Channel()
	}

	log.Printf("Client connected to realtime stream for poll: %s", pollID)

	// Notify client connection is alive
	c.SSEvent("message", `{"type": "connected"}`)
	c.Writer.Flush()

	// 4. Heartbeat ticker (keep-alive)
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	// 5. Connection loop
	c.Stream(func(w io.Writer) bool {
		select {
		case <-c.Request.Context().Done():
			log.Printf("Client disconnected from realtime stream for poll: %s", pollID)
			return false // stop streaming
		case msg := <-ch:
			// Forward redis event payload
			c.SSEvent("message", msg.Payload)
			return true
		case <-ticker.C:
			// Send heartbeat
			c.SSEvent("message", `{"type": "heartbeat"}`)
			return true
		}
	})
}
