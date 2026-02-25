package telemetry

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdkresource "go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

// Setup initializes the OTel SDK with OTLP/HTTP exporters (vendor-agnostic).
//
// The OTLP endpoint is read from the standard env var OTEL_EXPORTER_OTLP_ENDPOINT
// (default: http://localhost:4317). To point to a Datadog agent or any OTel
// Collector, set that env var — no code change required.
//
// Returns a shutdown function that must be deferred before process exit to
// flush pending spans and metrics.
func Setup(ctx context.Context, serviceName, serviceVersion string) (func(context.Context) error, error) {
	res, err := sdkresource.New(ctx,
		// Programmatic defaults (lowest priority).
		sdkresource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.ServiceVersion(serviceVersion),
		),
		sdkresource.WithTelemetrySDK(),
		sdkresource.WithHost(),
		// Standard OTel env vars (OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES)
		// override the defaults above — vendor-agnostic configuration.
		sdkresource.WithFromEnv(),
	)
	if err != nil {
		return nil, fmt.Errorf("creating OTel resource: %w", err)
	}

	// ── Tracer provider ─────────────────────────────────────────────────────
	// otlptracehttp reads OTEL_EXPORTER_OTLP_ENDPOINT / OTEL_EXPORTER_OTLP_TRACES_ENDPOINT.
	traceExp, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating OTLP trace exporter: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExp),
		sdktrace.WithResource(res),
		// AlwaysSample is suitable for dev/staging. For production, override with
		// OTEL_TRACES_SAMPLER=parentbased_traceidratio and OTEL_TRACES_SAMPLER_ARG=0.1
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	otel.SetTracerProvider(tp)

	// W3C TraceContext + Baggage propagation — compatible with all vendors.
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	// ── Meter provider ──────────────────────────────────────────────────────
	// otlpmetrichttp reads OTEL_EXPORTER_OTLP_ENDPOINT / OTEL_EXPORTER_OTLP_METRICS_ENDPOINT.
	metricExp, err := otlpmetrichttp.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating OTLP metric exporter: %w", err)
	}

	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExp)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	return func(ctx context.Context) error {
		if err := tp.Shutdown(ctx); err != nil {
			return err
		}
		return mp.Shutdown(ctx)
	}, nil
}
