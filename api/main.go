package main

import (
	"gsm/handlers"
	middlewares "gsm/middleware"
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

	// Create a separate group for SSE endpoints with modified middleware
	sseGroup := r.Group("")
	sseGroup.Use(func(c *gin.Context) {
		// Set SSE headers before authentication
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")

		// Continue with authentication
		middlewares.CheckUser(c)
		if c.IsAborted() {
			return
		}
		middlewares.RequireUser(c)
	})

	// Move SSE endpoints to the SSE group
	sseGroup.GET("/docker/logs/:id/stream", handlers.LogsStream)
	sseGroup.GET("/docker/events", handlers.StreamDockerEvents)
	sseGroup.GET("/system/resources/stream", handlers.StreamSystemResources)

	// Docker Routes (non-SSE)
	r.POST("/docker/run", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), handlers.Run)
	r.POST("/docker/rm/:id", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), handlers.Rm)
	r.POST("/docker/ps", middlewares.CheckUser, middlewares.RequireUser, handlers.ContainerList)
	r.GET("/docker/inspect/:id", middlewares.CheckUser, middlewares.RequireUser, handlers.InspectContainer)
	r.GET("/docker/images", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), handlers.ImageList)
	r.GET("/docker/pull", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), handlers.Pull)
	r.DELETE("/docker/images/:id", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), handlers.RmImage)
	r.POST("/docker/start/:id", middlewares.CheckUser, middlewares.RequireUser, handlers.Start)
	r.POST("/docker/stop/:id", middlewares.CheckUser, middlewares.RequireUser, handlers.Stop)
	r.POST("/docker/restart/:id", middlewares.CheckUser, middlewares.RequireUser, handlers.Restart)
	r.GET("/docker/logs/:id", middlewares.CheckUser, middlewares.RequireUser, handlers.Logs)
	r.GET("/docker/connections", handlers.GetContainerConnections)
	r.POST("/docker/exec/:id", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), handlers.ExecInContainer)

	// OAuth Routes
	r.GET("/signin", handlers.Login)
	r.GET("/signout", handlers.SignOut)
	r.GET("/callback", func(ctx *gin.Context) {
		handlers.OAuthCallback(ctx, db)
	})
	r.GET("/user", middlewares.CheckUser, func(ctx *gin.Context) {
		handlers.GetUser(ctx, db)
	})

	// User Management Routes
	r.GET("/users/allowed", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), func(ctx *gin.Context) {
		handlers.ListAllowedUsers(ctx, db)
	})
	r.POST("/users/allowed", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), func(ctx *gin.Context) {
		handlers.AddAllowedUser(ctx, db)
	})
	r.DELETE("/users/allowed/:email", middlewares.CheckUser, middlewares.RequireUser, middlewares.RequireRole("admin"), func(ctx *gin.Context) {
		handlers.RemoveAllowedUser(ctx, db)
	})

	// System Routes
	r.GET("/system/resources", middlewares.CheckUser, middlewares.RequireUser, handlers.GetSystemResources)

	// File Routes
	r.GET("/files", middlewares.CheckUser, middlewares.RequireUser, handlers.ListFiles)
	r.GET("/files/content", middlewares.CheckUser, middlewares.RequireUser, handlers.ReadFile)
	r.POST("/files/content", middlewares.CheckUser, middlewares.RequireUser, handlers.WriteFile)
	r.POST("/files/directory", middlewares.CheckUser, middlewares.RequireUser, handlers.CreateDirectory)
	r.DELETE("/files", middlewares.CheckUser, middlewares.RequireUser, handlers.DeletePath)
	r.POST("/files/move", middlewares.CheckUser, middlewares.RequireUser, handlers.MovePath)
	r.GET("/files/download", middlewares.CheckUser, middlewares.RequireUser, handlers.DownloadFile)
	r.POST("/files/upload", middlewares.CheckUser, middlewares.RequireUser, handlers.UploadFile)

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
