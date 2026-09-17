package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthCheck responds with a simple JSON indicating the server is running.
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Live Polling Tool Backend is running",
	})
}
