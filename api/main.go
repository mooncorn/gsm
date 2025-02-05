package main

import (
	handlers "gsm/handlers"
	middleware "gsm/middleware"
	"log"
	"os"
	"strings"

	"gsm/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const DATABASE_PATH = "/gsm/app.db"

func main() {
	// Load environment variables
	loadEnv()

	// Initialize database and migrate models
	db := initializeDatabase()

	// Allow admin user to login
	if err := db.Where("email = ?", os.Getenv("ADMIN_EMAIL")).First(&models.AllowedUser{}).Error; err != nil {
		db.Create(&models.AllowedUser{Email: os.Getenv("ADMIN_EMAIL"), Role: "admin"})
		log.Println("Allowed admin user created")
	}

	// Set Gin mode based on environment
	setGinMode()

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("ALLOW_ORIGIN")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cache-Control", "Connection", "Transfer-Encoding"},
		AllowCredentials: true, // Allow cookies to be sent with the requests
	}))

	// Set SSE group headers
	sseGroup := r.Group("")
	sseGroup.Use(func(c *gin.Context) {
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
	})

	r.GET("/signin", handlers.Login)
	r.GET("/signout", handlers.SignOut)
	r.GET("/callback", func(ctx *gin.Context) {
		handlers.OAuthCallback(ctx, db)
	})

	r.Use(middleware.CheckUser, middleware.RequireUser)

	// Register Docker handlers
	handlers.RegisterDockerHandlers(r, sseGroup)
	handlers.RegisterFileHandlers(r)

	// Move SSE endpoints to the SSE group
	sseGroup.GET("/system/resources/stream", handlers.StreamSystemResources)

	// OAuth Routes

	r.GET("/user", middleware.CheckUser, func(ctx *gin.Context) {
		handlers.GetUser(ctx, db)
	})

	// User Management Routes
	r.GET("/users/allowed", middleware.CheckUser, middleware.RequireUser, middleware.RequireRole("admin"), func(ctx *gin.Context) {
		handlers.ListAllowedUsers(ctx, db)
	})
	r.POST("/users/allowed", middleware.CheckUser, middleware.RequireUser, middleware.RequireRole("admin"), func(ctx *gin.Context) {
		handlers.AddAllowedUser(ctx, db)
	})
	r.DELETE("/users/allowed/:email", middleware.CheckUser, middleware.RequireUser, middleware.RequireRole("admin"), func(ctx *gin.Context) {
		handlers.RemoveAllowedUser(ctx, db)
	})

	// System Routes
	r.GET("/system/resources", middleware.CheckUser, middleware.RequireUser, handlers.GetSystemResources)

	if strings.ToLower(os.Getenv("APP_ENV")) == "production" {
		certFile := os.Getenv("SSL_CERT_FILE")
		keyFile := os.Getenv("SSL_KEY_FILE")

		if err := r.RunTLS(":8080", certFile, keyFile); err != nil {
			log.Fatalf("Failed to start server on 8080: %v", err)
		}
	} else {
		if err := r.Run(":8080"); err != nil {
			log.Fatalf("Failed to start server on 8080: %v", err)
		}
	}
}

func loadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
}

func initializeDatabase() *gorm.DB {
	db, err := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.AllowedUser{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func setGinMode() {
	if strings.ToLower(os.Getenv("APP_ENV")) == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
}
