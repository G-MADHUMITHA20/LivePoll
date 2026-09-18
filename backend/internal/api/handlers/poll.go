package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/internship/live-polling-tool/backend/internal/service"
)

type PollHandler struct {
	pollService service.PollService
	voteService service.VoteService
}

func NewPollHandler(pollService service.PollService, voteService service.VoteService) *PollHandler {
	return &PollHandler{
		pollService: pollService,
		voteService: voteService,
	}
}

type createPollRequest struct {
	Question  string     `json:"question" binding:"required,max=300"`
	Options   []string   `json:"options" binding:"required,min=2,max=20,dive,required,max=100"`
	StartTime *time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
}

func (h *PollHandler) CreatePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	var req createPollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid input data"})
		return
	}

	poll, err := h.pollService.CreatePoll(c.Request.Context(), userID.(string), req.Question, req.Options, req.StartTime, req.EndTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"poll":    poll,
	})
}

func (h *PollHandler) GetMyPolls(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	polls, err := h.pollService.GetPollsByOwner(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve polls"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"polls":   polls,
	})
}

func (h *PollHandler) GetPoll(c *gin.Context) {
	pollID := c.Param("id")
	userID, _ := c.Get("userID")

	poll, err := h.pollService.GetPollByID(c.Request.Context(), pollID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
		return
	}

	results, err := h.voteService.GetPollResults(c.Request.Context(), pollID)
	if err != nil {
		results = make(map[string]int) // fallback to empty results if fetch fails
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"poll":    poll,
		"results": results,
	})
}

func (h *PollHandler) UpdatePoll(c *gin.Context) {
	pollID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	var req struct {
		Question  string     `json:"question" binding:"required,max=300"`
		Options   []string   `json:"options" binding:"required,min=2,max=20,dive,required,max=100"`
		Status    string     `json:"status"`
		StartTime *time.Time `json:"start_time"`
		EndTime   *time.Time `json:"end_time"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid input data"})
		return
	}

	poll, err := h.pollService.UpdatePoll(c.Request.Context(), pollID, userID.(string), req.Question, req.Options, req.Status, req.StartTime, req.EndTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"poll":    poll,
	})
}
