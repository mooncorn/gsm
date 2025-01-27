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

	// Docker Routes
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
	r.GET("/docker/logs/:id/stream", middlewares.CheckUser, middlewares.RequireUser, handlers.LogsStream)
	r.GET("/docker/logs/:id", middlewares.CheckUser, middlewares.RequireUser, handlers.Logs)
	r.GET("/docker/events", middlewares.CheckUser, middlewares.RequireUser, handlers.StreamDockerEvents)
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
	r.GET("/system/resources/stream", middlewares.CheckUser, middlewares.RequireUser, handlers.StreamSystemResources)

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
