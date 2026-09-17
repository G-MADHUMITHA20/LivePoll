package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds basic HTTP security headers
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		// c.Header("Content-Security-Policy", "default-src 'self'") // Adjust based on frontend decoupling
		c.Next()
	}
}

// RequestSizeLimit restricts the request body to prevent memory exhaustion / DoS
func RequestSizeLimit(limitBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limitBytes)
		c.Next()
	}
}
