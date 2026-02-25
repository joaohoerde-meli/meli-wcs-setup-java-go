package client

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

type JavaClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewJavaClient(baseURL string) *JavaClient {
	return &JavaClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
			// otelhttp.NewTransport wraps the transport to:
			//  1. Create a child span for each outgoing HTTP call.
			//  2. Inject W3C TraceContext headers so the Java service continues the trace.
			Transport: otelhttp.NewTransport(&http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			}),
		},
	}
}

// Get performs an instrumented HTTP GET to the Java service.
// The context carries the active OTel span; otelhttp propagates it as a child span.
func (c *JavaClient) Get(ctx context.Context, path string) ([]byte, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		slog.ErrorContext(ctx, "failed to build HTTP request to java service",
			"operation", "java_client_get",
			"path", path,
			"result", "REQUEST_BUILD_ERROR",
			"error", err.Error(),
		)
		return nil, 0, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		slog.ErrorContext(ctx, "HTTP GET to java service failed",
			"operation", "java_client_get",
			"path", path,
			"result", "CONNECTION_ERROR",
			"remediation", "verify java-service is running and reachable at the configured JAVA_SERVICE_URL",
			"error", err.Error(),
		)
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		slog.ErrorContext(ctx, "failed to read java service response body",
			"operation", "java_client_get",
			"path", path,
			"http_status", resp.StatusCode,
			"result", "READ_ERROR",
			"remediation", "check for network instability or java-service crash mid-response",
			"error", err.Error(),
		)
	}
	return body, resp.StatusCode, err
}
