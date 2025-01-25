package middlewares

import (
	"fmt"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

func CheckUser(c *gin.Context) {
	tokenString, err := c.Cookie("token")
	if err != nil {
		// If cookie is not found, allow unauthenticated access
		c.Next()
		return
	}

	// Parse the JWT token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		c.Next()
		return
	}

	// If token is valid, store claims in context
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if id, exists := claims["id"].(string); exists {
			c.Set("userID", id)
		}
		if email, exists := claims["email"].(string); exists {
			c.Set("userEmail", email)
		}
		if role, exists := claims["role"].(string); exists {
			c.Set("userRole", role)
		}
		if picture, exists := claims["picture"].(string); exists {
			c.Set("userPicture", picture)
		}
	}

	c.Next()
}

func RequireRole(role string) func(c *gin.Context) {
	return func(c *gin.Context) {
		userRole := c.GetString("userRole")

		if !strings.EqualFold(userRole, role) {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireUser(c *gin.Context) {
	_, userEmailExists := c.Get("userEmail")
	_, userRoleExists := c.Get("userRole")

	userExists := userEmailExists && userRoleExists

	if !userExists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		c.Abort()
		return
	}

	c.Next()
}
