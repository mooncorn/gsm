package config

import (
	"os"
	"path"
)

type Config struct {
	AppEnv         string
	Port           string
	DataDir        string
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
			Port:           getEnvOrDefault("PORT", "8080"),
			DataDir:        getEnvOrDefault("DATA_DIR", path.Join(os.Getenv("HOME"), "gsm-data")),
			AllowOrigin:    getEnvOrDefault("ALLOW_ORIGIN", "http://localhost:5173"),
			CookieDomain:   getEnvOrDefault("COOKIE_DOMAIN", "localhost"),
			SSLCertFile:    os.Getenv("SSL_CERT_FILE"),
			SSLKeyFile:     os.Getenv("SSL_KEY_FILE"),
			GoogleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
			GoogleSecret:   os.Getenv("GOOGLE_CLIENT_SECRET"),
			GoogleRedirect: os.Getenv("GOOGLE_REDIRECT_URL"),
			JWTSecret:      getEnvOrDefault("JWT_SECRET", "secret"),
			AdminEmail:     os.Getenv("ADMIN_EMAIL"),
		}
	}
	return cfg
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
