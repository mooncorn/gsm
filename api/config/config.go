package config

import (
	"log"
	"os"
)

type Config struct {
	AppEnv         string
	Port           string
	HostHome       string
	DataDir        string
	VolumeDir      string
	DBFilename     string
	AllowOrigin    string
	CookieDomain   string
	SSLCertFile    string
	SSLKeyFile     string
	GoogleClientID string
	GoogleSecret   string
	GoogleRedirect string
	JWTSecret      string
	AdminEmail     string
}

var cfg *Config

func Get() *Config {
	if cfg == nil {
		cfg = &Config{
			AppEnv:         getEnvOrDefault("APP_ENV", "development"),
			Port:           getEnvOrDefault("PORT", "8181"),
			HostHome:       requiredEnv("HOST_HOME"),
			DataDir:        getEnvOrDefault("DATA_DIR", "/gsm-data"),
			VolumeDir:      getEnvOrDefault("VOLUME_DIR", "/volumes"),
			DBFilename:     getEnvOrDefault("DB_FILENAME", "app.db"),
			AllowOrigin:    getEnvOrDefault("ALLOW_ORIGIN", "http://localhost:8282"),
			CookieDomain:   getEnvOrDefault("COOKIE_DOMAIN", "localhost"),
			SSLCertFile:    os.Getenv("SSL_CERT_FILE"),
			SSLKeyFile:     os.Getenv("SSL_KEY_FILE"),
			GoogleClientID: requiredEnv("GOOGLE_CLIENT_ID"),
			GoogleSecret:   requiredEnv("GOOGLE_CLIENT_SECRET"),
			GoogleRedirect: requiredEnv("GOOGLE_REDIRECT_URL"),
			JWTSecret:      getEnvOrDefault("JWT_SECRET", "secret"),
			AdminEmail:     requiredEnv("ADMIN_EMAIL"),
		}
	}

	return cfg
}

func requiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Environment variable %s is not set", key)
	}
	return value
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
