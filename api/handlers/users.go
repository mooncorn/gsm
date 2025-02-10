package handlers

import (
	middleware "gsm/middleware"
	"gsm/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type usersHandler struct {
	db *gorm.DB
}

func NewUsersHandler(db *gorm.DB) *usersHandler {
	return &usersHandler{db: db}
}

func (h *usersHandler) RegisterUsersRoutes(rg *gin.RouterGroup) {
	rg.Use(middleware.CheckUser, middleware.RequireUser, middleware.RequireRole("admin"))

	rg.GET("/", h.listAllowedUsers)
	rg.POST("/", h.addAllowedUser)
	rg.DELETE("/:email", h.removeAllowedUser)
}

func (h *usersHandler) listAllowedUsers(c *gin.Context) {
	var users []models.AllowedUser
	if err := h.db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *usersHandler) addAllowedUser(c *gin.Context) {
	var user models.AllowedUser
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Set default role if not provided
	if user.Role == "" {
		user.Role = models.UserRoleDefault
	}

	// Check if user already exists
	var existingUser models.AllowedUser
	if err := h.db.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *usersHandler) removeAllowedUser(c *gin.Context) {
	email := c.Param("email")

	// Check if user exists
	var user models.AllowedUser
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Don't allow removing the last admin
	if user.Role == models.UserRoleAdmin {
		var adminCount int64
		h.db.Model(&models.AllowedUser{}).Where("role = ?", models.UserRoleAdmin).Count(&adminCount)
		if adminCount <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot remove the last admin user"})
			return
		}
	}

	// Use Unscoped().Delete() for hard deletion
	if err := h.db.Unscoped().Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove user"})
		return
	}

	c.Status(http.StatusOK)
}
