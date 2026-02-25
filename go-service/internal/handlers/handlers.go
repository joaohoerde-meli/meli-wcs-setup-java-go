package handlers

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"

	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/client"
	"github.com/joaohoerde-meli/meli-wcs-setup-java-go/go-service/internal/telemetry"
)

type Handler struct {
	javaClient *client.JavaClient
	proxy      *httputil.ReverseProxy
	metrics    *telemetry.WcsMetrics
}

func New(javaClient *client.JavaClient, javaBaseURL string, metrics *telemetry.WcsMetrics) *Handler {
	target, _ := url.Parse(javaBaseURL)
	return &Handler{
		javaClient: javaClient,
		proxy:      httputil.NewSingleHostReverseProxy(target),
		metrics:    metrics,
	}
}

// GetTopology handles GET /api/topology/:sorterId — direct fast-path read.
func (h *Handler) GetTopology(c *gin.Context) {
	ctx := c.Request.Context()
	sorterID := c.Param("sorterId")
	start := time.Now()

	h.metrics.RequestCounter.Add(ctx, 1,
		metric.WithAttributes(attribute.String("operation", "get_topology")),
	)

	body, status, err := h.javaClient.Get(ctx, "/api/topology/"+sorterID)

	h.metrics.RequestDuration.Record(ctx,
		float64(time.Since(start).Milliseconds()),
		metric.WithAttributes(attribute.String("operation", "get_topology")),
	)

	if err != nil {
		h.metrics.UpstreamErrorCounter.Add(ctx, 1,
			metric.WithAttributes(attribute.String("operation", "get_topology")),
		)
		// slog.ErrorContext propagates ctx so TraceHandler injects trace_id + span_id.
		slog.ErrorContext(ctx, "topology read failed: java service unreachable",
			"operation", "get_topology",
			"sorter_id", sorterID,
			"result", "BAD_GATEWAY",
			"remediation", "check java-service health and internal network connectivity",
			"error", err.Error(),
		)
		c.JSON(http.StatusBadGateway, gin.H{"error": "upstream unavailable"})
		return
	}
	c.Data(status, "application/json; charset=utf-8", body)
}

// GetTopologyExits handles GET /api/topology_exits/:sorterId — direct fast-path read.
func (h *Handler) GetTopologyExits(c *gin.Context) {
	ctx := c.Request.Context()
	sorterID := c.Param("sorterId")
	start := time.Now()

	h.metrics.RequestCounter.Add(ctx, 1,
		metric.WithAttributes(attribute.String("operation", "get_topology_exits")),
	)

	body, status, err := h.javaClient.Get(ctx, "/api/topology_exits/"+sorterID)

	h.metrics.RequestDuration.Record(ctx,
		float64(time.Since(start).Milliseconds()),
		metric.WithAttributes(attribute.String("operation", "get_topology_exits")),
	)

	if err != nil {
		h.metrics.UpstreamErrorCounter.Add(ctx, 1,
			metric.WithAttributes(attribute.String("operation", "get_topology_exits")),
		)
		slog.ErrorContext(ctx, "topology exits read failed: java service unreachable",
			"operation", "get_topology_exits",
			"sorter_id", sorterID,
			"result", "BAD_GATEWAY",
			"remediation", "check java-service health and internal network connectivity",
			"error", err.Error(),
		)
		c.JSON(http.StatusBadGateway, gin.H{"error": "upstream unavailable"})
		return
	}
	c.Data(status, "application/json; charset=utf-8", body)
}

// ProxyToJava transparently proxies all other requests to the Java service.
func (h *Handler) ProxyToJava(c *gin.Context) {
	h.proxy.ServeHTTP(c.Writer, c.Request)
}
