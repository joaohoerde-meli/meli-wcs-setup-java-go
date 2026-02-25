package telemetry

import (
	"context"
	"log/slog"

	"go.opentelemetry.io/otel/trace"
)

// TraceHandler wraps any slog.Handler and injects trace_id + span_id from the
// active OTel span into every log record. This enables log-trace correlation in
// Datadog: clicking a log entry navigates directly to the corresponding trace.
type TraceHandler struct {
	inner slog.Handler
}

// NewTraceHandler returns a slog.Handler that enriches records with OTel span context.
func NewTraceHandler(inner slog.Handler) slog.Handler {
	return &TraceHandler{inner: inner}
}

func (h *TraceHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.inner.Enabled(ctx, level)
}

func (h *TraceHandler) Handle(ctx context.Context, r slog.Record) error {
	if span := trace.SpanFromContext(ctx); span.SpanContext().IsValid() {
		sc := span.SpanContext()
		r.AddAttrs(
			slog.String("trace_id", sc.TraceID().String()),
			slog.String("span_id", sc.SpanID().String()),
		)
	}
	return h.inner.Handle(ctx, r)
}

func (h *TraceHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &TraceHandler{inner: h.inner.WithAttrs(attrs)}
}

func (h *TraceHandler) WithGroup(name string) slog.Handler {
	return &TraceHandler{inner: h.inner.WithGroup(name)}
}
