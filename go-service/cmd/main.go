package main

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"

	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/client"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/config"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/handlers"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/telemetry"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	// ── Log level (Fury: Warn/Error in production, Info in dev/test) ────────
	level := slog.LevelInfo
	if strings.EqualFold(cfg.Scope, "production") || strings.EqualFold(cfg.Scope, "prod") {
		level = slog.LevelWarn
	}
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	// TraceHandler wraps the JSON handler to inject trace_id + span_id into every log record.
	slog.SetDefault(slog.New(telemetry.NewTraceHandler(jsonHandler)))

	// ── OpenTelemetry SDK (TracerProvider + MeterProvider) ──────────────────
	// OTLP endpoint is read from OTEL_EXPORTER_OTLP_ENDPOINT (vendor-agnostic).
	shutdown, err := telemetry.Setup(ctx, cfg.ServiceName, cfg.ServiceVersion)
	if err != nil {
		slog.Warn("OTel SDK setup failed: traces and metrics will not be exported",
			"remediation", "verify OTEL_EXPORTER_OTLP_ENDPOINT is reachable",
			"error", err.Error(),
		)
	} else {
		defer func() {
			if err := shutdown(ctx); err != nil {
				slog.Error("OTel SDK shutdown error: some telemetry may have been lost",
					"error", err.Error(),
				)
			}
		}()
	}

	// ── Metrics instruments ──────────────────────────────────────────────────
	metrics, err := telemetry.NewWcsMetrics()
	if err != nil {
		slog.Error("failed to initialize OTel metrics instruments",
			"remediation", "check that OTel SDK was successfully set up",
			"error", err.Error(),
		)
		os.Exit(1)
	}

	// ── HTTP router ──────────────────────────────────────────────────────────
	javaClient := client.NewJavaClient(cfg.JavaServiceURL)
	h := handlers.New(javaClient, cfg.JavaServiceURL, metrics)

	// Use gin.New() instead of gin.Default() to avoid Gin's non-structured logger.
	// otelgin.Middleware creates a span per request and propagates W3C TraceContext headers.
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(otelgin.Middleware(cfg.ServiceName))

	// High-performance direct handlers for hot topology reads
	r.GET("/api/topology/:sorterId", h.GetTopology)
	r.GET("/api/topology_exits/:sorterId", h.GetTopologyExits)

	// Transparent reverse proxy for all CRUD management → Java service
	r.Any("/api/*path", h.ProxyToJava)

	slog.Info("WCS Go gateway starting",
		"port", cfg.Port,
		"java_url", cfg.JavaServiceURL,
		"scope", cfg.Scope,
		"service", cfg.ServiceName,
	)
	if err := r.Run(":" + cfg.Port); err != nil {
		slog.Error("server failed to start — check if port is already in use",
			"port", cfg.Port,
			"error", err.Error(),
		)
		os.Exit(1)
	}
}
