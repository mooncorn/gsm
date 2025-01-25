package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"gsm/models"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"google.golang.org/api/idtoken"
	"gorm.io/gorm"
)

var SECURE = strings.ToLower(os.Getenv("APP_ENV")) == "production"
var SAME_SITE = getSameSite()

func generateState() string {
	b := make([]byte, 32) // 32 bytes should be sufficient
	_, err := rand.Read(b)
	if err != nil {
		panic("failed to generate random state")
	}
	return base64.URLEncoding.EncodeToString(b)
}

func initOAuthConfig() oauth2.Config {
	return oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"), // Make sure this matches your redirect URI
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func Login(c *gin.Context) {
	oauth2Config := initOAuthConfig()

	oauth2State := generateState()
	c.SetSameSite(SAME_SITE)
	c.SetCookie("csrf", oauth2State, 3600, "/", os.Getenv("COOKIE_DOMAIN"), SECURE, true) // Set cookie for 1 hour

	// Redirect the user to Google's OAuth consent screen
	authURL := oauth2Config.AuthCodeURL(oauth2State, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusFound, authURL)
}

func OAuthCallback(c *gin.Context, db *gorm.DB) {
	oauth2Config := initOAuthConfig()

	// Validate the state parameter to protect against CSRF attacks
	storedState, err := c.Cookie("csrf")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "State cookie missing"})
		return
	}

	if storedState != c.DefaultQuery("state", "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state"})
		return
	}

	// Exchange the authorization code for an access token
	code := c.DefaultQuery("code", "")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code missing"})
		return
	}

	// Exchange the code for a token
	token, err := oauth2Config.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code for token"})
		return
	}

	// Validate the ID token
	payload, err := idtoken.Validate(c, token.Extra("id_token").(string), os.Getenv("GOOGLE_CLIENT_ID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid ID token"})
		return
	}

	// Extract the email and picture from the ID token
	email, ok := payload.Claims["email"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email not found in token"})
		return
	}

	picture, _ := payload.Claims["picture"].(string)

	// Check if the user is allowed to sign in
	var allowedUser models.AllowedUser
	if err := db.Where("email = ?", email).First(&allowedUser).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not allowed to sign in"})
		return
	}

	// Create a new user instance or update existing one
	user := models.User{
		Email:   email,
		Role:    allowedUser.Role,
		Picture: picture,
	}

	var existingUser models.User
	if err := db.Where("email = ?", user.Email).First(&existingUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		if err := db.Model(&existingUser).Updates(user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update user"})
			return
		}
	}

	// Generate JWT token for the user
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":      user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"picture": user.Picture,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})
	tokenString, err := jwtToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.SetSameSite(SAME_SITE)
	c.SetCookie("token", tokenString, 86400, "/", os.Getenv("COOKIE_DOMAIN"), SECURE, true) // Set cookie for 1 day

	c.Redirect(http.StatusFound, os.Getenv("ALLOW_ORIGIN"))
}

func GetUser(c *gin.Context, db *gorm.DB) {
	// Retrieve the user email from the context
	userEmail, exists := c.Get("userEmail")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User email not found in context"})
		return
	}

	// Cast the user email to string
	email, ok := userEmail.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user email format"})
		return
	}

	// Fetch the user information from the database
	var user models.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Return the user information as JSON
	c.JSON(http.StatusOK, user)
}

func getSameSite() http.SameSite {
	var sameSite http.SameSite
	if strings.ToLower(os.Getenv("APP_ENV")) == "production" {
		sameSite = http.SameSiteNoneMode
	} else {
		sameSite = http.SameSiteLaxMode
	}
	return sameSite
}

func SignOut(c *gin.Context) {
	c.SetSameSite(SAME_SITE)
	c.SetCookie("token", "", -1, "/", os.Getenv("COOKIE_DOMAIN"), SECURE, true) // Set cookie with an expired date

	c.Redirect(http.StatusFound, os.Getenv("ALLOW_ORIGIN"))
}
