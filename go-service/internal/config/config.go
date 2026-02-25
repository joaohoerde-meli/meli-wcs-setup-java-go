package config

import "os"

type Config struct {
	Port           string
	JavaServiceURL string
	Scope          string
	ServiceName    string
	ServiceVersion string
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

	scope := os.Getenv("SCOPE")
	if scope == "" {
		scope = "development"
	}

	serviceName := os.Getenv("OTEL_SERVICE_NAME")
	if serviceName == "" {
		serviceName = "wcs-go-service"
	}

	serviceVersion := os.Getenv("OTEL_SERVICE_VERSION")
	if serviceVersion == "" {
		serviceVersion = "1.0.0"
	}

	return &Config{
		Port:           port,
		JavaServiceURL: javaURL,
		Scope:          scope,
		ServiceName:    serviceName,
		ServiceVersion: serviceVersion,
	}
}
