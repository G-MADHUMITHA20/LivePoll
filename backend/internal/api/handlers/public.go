package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/internship/live-polling-tool/backend/internal/service"
)

type PublicHandler struct {
	voteService service.VoteService
}

func NewPublicHandler(voteService service.VoteService) *PublicHandler {
	return &PublicHandler{
		voteService: voteService,
	}
}

func (h *PublicHandler) GetPublicPoll(c *gin.Context) {
	pollID := c.Param("id")

	poll, err := h.voteService.GetPublicPoll(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Poll not found"})
		return
	}

	// For Stage 4, let's also fetch preliminary static results for the post-vote screen
	results, err := h.voteService.GetPollResults(c.Request.Context(), pollID)
	if err != nil {
		results = make(map[string]int) // ignore error for public view if votes fail
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"poll": gin.H{
			"id":         poll.ID.Hex(),
			"question":   poll.Question,
			"options":    poll.Options,
			"status":     poll.Status,
			"created_at": poll.CreatedAt,
			"expires_at": poll.ExpiresAt,
		},
		"results": results, // Optional static results mapping option_id -> count
	})
}

type submitVoteRequest struct {
	OptionID string `json:"option_id" binding:"required,hexadecimal,len=24"`
	VoterID  string `json:"voter_id" binding:"required,max=100"`
}

func (h *PublicHandler) SubmitVote(c *gin.Context) {
	pollID := c.Param("id")

	var req submitVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid request"})
		return
	}

	err := h.voteService.SubmitVote(c.Request.Context(), pollID, req.OptionID, req.VoterID)
	if err != nil {
		// Use HTTP 409 Conflict for duplicate votes, 400 for logic errors
		status := http.StatusBadRequest
		if err.Error() == "you have already voted in this poll" {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Vote submitted successfully",
	})
}
