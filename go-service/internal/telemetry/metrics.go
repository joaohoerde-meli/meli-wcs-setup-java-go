package telemetry

import (
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
)

// WcsMetrics holds the OTel instruments for the WCS Go gateway.
type WcsMetrics struct {
	// RequestCounter tracks the total number of requests per operation (label: operation).
	RequestCounter metric.Int64Counter
	// RequestDuration is a histogram of upstream call latency in milliseconds (label: operation).
	RequestDuration metric.Float64Histogram
	// UpstreamErrorCounter counts requests that failed due to java service unreachability.
	UpstreamErrorCounter metric.Int64Counter
}

// NewWcsMetrics registers OTel instruments against the global MeterProvider.
// Must be called after telemetry.Setup().
func NewWcsMetrics() (*WcsMetrics, error) {
	meter := otel.Meter("com.meli.wcs.go-service")

	reqCounter, err := meter.Int64Counter(
		"wcs.gateway.requests.total",
		metric.WithDescription("Total number of requests handled by the WCS Go gateway"),
		metric.WithUnit("{request}"),
	)
	if err != nil {
		return nil, err
	}

	reqDuration, err := meter.Float64Histogram(
		"wcs.gateway.request.duration_ms",
		metric.WithDescription("End-to-end latency of upstream calls from Go gateway to Java service"),
		metric.WithUnit("ms"),
	)
	if err != nil {
		return nil, err
	}

	errCounter, err := meter.Int64Counter(
		"wcs.gateway.upstream_errors.total",
		metric.WithDescription("Total upstream errors when the java service is unreachable or returns a read failure"),
		metric.WithUnit("{error}"),
	)
	if err != nil {
		return nil, err
	}

	return &WcsMetrics{
		RequestCounter:       reqCounter,
		RequestDuration:      reqDuration,
		UpstreamErrorCounter: errCounter,
	}, nil
}
