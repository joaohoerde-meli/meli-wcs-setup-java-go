package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/client"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/config"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/handlers"
)

func main() {
	cfg := config.Load()
	javaClient := client.NewJavaClient(cfg.JavaServiceURL)
	h := handlers.New(javaClient, cfg.JavaServiceURL)

	r := gin.Default()

	// High-performance direct handlers for hot topology reads
	r.GET("/api/topology/:sorterId", h.GetTopology)
	r.GET("/api/topology_exits/:sorterId", h.GetTopologyExits)

	// Transparent reverse proxy for all CRUD management → Java service
	r.Any("/api/*path", h.ProxyToJava)

	log.Printf("WCS Go gateway listening on :%s → Java %s", cfg.Port, cfg.JavaServiceURL)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
