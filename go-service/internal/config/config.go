package config

import "os"

type Config struct {
	Port           string
	JavaServiceURL string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	javaURL := os.Getenv("JAVA_SERVICE_URL")
	if javaURL == "" {
		javaURL = "http://localhost:8081"
	}

	return &Config{
		Port:           port,
		JavaServiceURL: javaURL,
	}
}
