# Fury Migration Guide

This document tracks the remaining steps to make `meli-wcs-setup-java-go` a
fully Fury-compliant production service.

## Status

| Item | Status | Notes |
|------|--------|-------|
| Docker images → hub.furycloud.io | ⚠️ TODO | Placeholders in both Dockerfiles |
| docker-compose marked as local-dev only | ✅ Done | Comments added |
| Java production profile (Fury Secrets) | ✅ Done | `application-production.yml` |
| Go service → fury-go-core | ⚠️ TODO | See section below |
| MySQL → Fury Database service | ⚠️ TODO | Provision via Fury panel |
| Fury Secrets (DB credentials) | ⚠️ TODO | See section below |
| fury test integration | ⚠️ TODO | Run `fury test` after Fury app created |
| SDD Kit specs (meli/ folder) | ⚠️ TODO | Run `/meli.reverse-eng` after kit installed |

---

## 1. Docker images

In each Dockerfile, replace the `# TODO` placeholder images.

To list your team's available images:
```bash
fury images list --filter java
fury images list --filter go
fury images list --filter alpine
```

**java-service/Dockerfile** — replace 3 occurrences:
```dockerfile
# Build stage
FROM hub.furycloud.io/mercadolibre/<fury_java_builder>:21 AS build

# Agent stage
FROM hub.furycloud.io/mercadolibre/<fury_java>:21-jre AS agent

# Runtime stage
FROM hub.furycloud.io/mercadolibre/<fury_java>:21-jre
```

**go-service/Dockerfile** — replace 2 occurrences:
```dockerfile
# Build stage
FROM hub.furycloud.io/mercadolibre/<fury_go_builder>:1.22 AS build

# Runtime stage
FROM hub.furycloud.io/mercadolibre/<fury_alpine>:3.19
```

---

## 2. Go service → fury-go-core

This is the biggest migration. The Go service uses Gin + a manual OTel setup.
fury-go-core replaces both with a single library.

**Requires FuryMCP or internal docs to confirm exact API.**
Run in Claude Code after FuryMCP is configured:
> "Using FuryMCP, show me how to migrate a Gin HTTP server to fury-go-core,
>  including httpclient for upstream calls and telemetry setup."

### What changes

| Current | Fury replacement |
|---------|-----------------|
| `github.com/gin-gonic/gin` | `github.com/mercadolibre/fury_go-core` (httpserver) |
| `go.opentelemetry.io/contrib/.../otelgin` | Built into fury-go-core |
| `go.opentelemetry.io/...` (manual SDK) | Built into fury-go-core telemetry |
| `internal/telemetry/otel.go` (custom setup) | Removed — fury-go-core handles it |
| `net/http.Client` + `otelhttp` transport | fury httpclient |
| `internal/config/config.go` OTel env vars | Removed — fury-go-core reads them |

### Files to rewrite

- `go-service/cmd/main.go` — replace gin router with fury httpserver
- `go-service/internal/client/java_client.go` — replace http.Client with fury httpclient
- `go-service/internal/telemetry/otel.go` — delete (fury-go-core handles OTel)
- `go-service/internal/telemetry/slog.go` — keep (structured logging stays)
- `go-service/internal/telemetry/metrics.go` — review (may be replaced by fury metrics)
- `go-service/internal/config/config.go` — remove OTel-specific fields
- `go-service/go.mod` — remove gin, otelgin, manual OTel deps; add fury-go-core

### Business logic (NO changes needed)

- `internal/handlers/handlers.go` — handler functions stay the same
  (only the `*gin.Context` parameter type changes to fury equivalent)

---

## 3. Fury application creation

Before deploying, create the Fury applications:

```bash
# Create Go gateway application
fury app create wcs-go-service --lang go --team <your-team>

# Create Java service application
fury app create wcs-java-service --lang java --team <your-team>
```

---

## 4. MySQL → Fury Database service

1. Request a Fury MySQL database from the Fury panel or:
   ```bash
   fury db create wcs-db --engine mysql --version 8.0 --app wcs-java-service
   ```
2. Copy the connection string from the Fury panel
3. Set it as a Fury Secret:
   ```bash
   fury secret create WCS_DB_URL \
     --value "jdbc:mysql://<host>:3306/wcs_db?useSSL=true&serverTimezone=UTC" \
     --app wcs-java-service
   ```

---

## 5. Fury Secrets (DB credentials)

```bash
# Create secrets
fury secret create WCS_DB_USERNAME --value "wcs_user" --app wcs-java-service
fury secret create WCS_DB_PASSWORD --value "<strong-password>" --app wcs-java-service

# Map to environment variables in Fury application config
# (fury.yml or Fury UI → Environment Variables section)
SPRING_DATASOURCE_URL      → secret:WCS_DB_URL
SPRING_DATASOURCE_USERNAME → secret:WCS_DB_USERNAME
SPRING_DATASOURCE_PASSWORD → secret:WCS_DB_PASSWORD
```

---

## 6. fury test

After the Fury application is created and running:

```bash
fury test --app wcs-java-service
fury test --app wcs-go-service
```

This must pass before merging to main/master (required by SDD Kit `/meli.finish`).

---

## 7. SDD Kit specs (when kit is installed)

Once `~/.meli-sdd-kit/` is installed, run:

```
/meli.reverse-eng
```

This will generate retroactive functional and technical specs from the existing
codebase, creating the `meli/` folder structure required by the SDD Kit.
