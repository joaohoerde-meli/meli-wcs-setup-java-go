# ─────────────────────────────────────────────────────────────────────────────
# TODO (Fury migration): Replace all base images with your team's
# hub.furycloud.io equivalents. Run the following to discover available images:
#   fury images list --filter go
# Example names (confirm with your squad):
#   hub.furycloud.io/mercadolibre/fury_go_builder:1.22
#   hub.furycloud.io/mercadolibre/fury_alpine:3.19
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1 — build
# TODO: replace with hub.furycloud.io/mercadolibre/fury_go_builder:1.22 (or team equivalent)
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /go-service ./cmd

# Stage 2 — runtime
# TODO: replace with hub.furycloud.io/mercadolibre/fury_alpine:3.19 (or team equivalent)
# NOTE (Fury): fury-go-core migration (replacing Gin) should be done before
# moving to production. See FURY_MIGRATION.md for the full migration plan.
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /go-service .
EXPOSE 8080
CMD ["./go-service"]
