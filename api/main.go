package main

import (
	"fmt"
	"gsm/config"
	handlers "gsm/handlers"
	"log"
	"path"
	"strings"

	"gsm/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const DATABASE_NAME = "app.db"

func main() {
	loadEnv()
	cfg := config.Get()

	db := initializeDatabase()

	if err := db.Where("email = ?", cfg.AdminEmail).First(&models.AllowedUser{}).Error; err != nil {
		db.Create(&models.AllowedUser{Email: cfg.AdminEmail, Role: "admin"})
		log.Println("Allowed admin user created")
	}

	r := gin.Default()

	setGinMode()
	configureCors(r)
	registerRoutes(r, db)
	startServer(r)
}

func configureCors(r *gin.Engine) {
	cfg := config.Get()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cache-Control", "Connection", "Transfer-Encoding"},
		AllowCredentials: true,
	}))
}

func loadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
}

func initializeDatabase() *gorm.DB {
	fmt.Println(getDatabasePath())
	db, err := gorm.Open(sqlite.Open(getDatabasePath()), &gorm.Config{})

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
	if strings.ToLower(config.Get().AppEnv) == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
}

func registerRoutes(r *gin.Engine, db *gorm.DB) {
	// Register Auth handlers
	authHandler := handlers.NewAuthHandler(db)
	authHandler.RegisterAuthHandlers(r.Group("/auth"))

	// Register Docker handlers
	dockerHandler, err := handlers.NewDockerHandler()
	if err != nil {
		log.Fatalf("Failed to create docker handler: %v", err)
	}
	dockerHandler.RegisterDockerHandlers(r.Group("/docker"))

	// Register File handlers
	fileHandler, err := handlers.NewFileHandler()
	if err != nil {
		log.Fatalf("Failed to create file handler: %v", err)
	}
	fileHandler.RegisterFileHandlers(r.Group("/files"))

	// Register System handlers
	handlers.RegisterSystemRoutes(r.Group("/system"))

	// User Management Routes
	usersHandler := handlers.NewUsersHandler(db)
	usersHandler.RegisterUsersRoutes(r.Group("/users"))
}

func startServer(r *gin.Engine) {
	cfg := config.Get()
	if strings.ToLower(cfg.AppEnv) == "production" {
		if err := r.RunTLS(fmt.Sprintf(":%s", cfg.Port), cfg.SSLCertFile, cfg.SSLKeyFile); err != nil {
			log.Fatalf("Failed to start server on %s: %v", cfg.Port, err)
		}
	} else {
		if err := r.Run(fmt.Sprintf(":%s", cfg.Port)); err != nil {
			log.Fatalf("Failed to start server on %s: %v", cfg.Port, err)
		}
	}
}

func getDatabasePath() string {
	cfg := config.Get()
	return path.Join(cfg.DataDir, DATABASE_NAME)
}
