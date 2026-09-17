package middleware

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IP-based Rate Limiter mapping
var (
	visitors = make(map[string]*rate.Limiter)
	mu       sync.Mutex
)

// getVisitor retrieves or creates a limiter for the given IP address
func getVisitor(ip string, r rate.Limit, b int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limiter, exists := visitors[ip]
	if !exists {
		limiter = rate.NewLimiter(r, b)
		visitors[ip] = limiter
	}

	return limiter
}

// RateLimit returns a gin middleware for rate limiting (requests per second, burst)
func RateLimit(r rate.Limit, burst int) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getVisitor(ip, r, burst)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
