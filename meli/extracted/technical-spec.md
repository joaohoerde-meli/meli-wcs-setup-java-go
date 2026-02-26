# Technical Specification — WCS Topology Setup

**Project**: meli-wcs-setup-java-go
**Version**: 1.0.0
**Generated**: 2026-02-26
**Source**: Code analysis only (🔸 CODE_ONLY — FuryMCP not yet available)
**Extraction mode**: FULL

---

## 1. Architecture

### Service Topology

```
Internet / Frontend
        │
        ▼ HTTP :8080
┌─────────────────────────────────────────┐
│  wcs-go-service  (Go 1.22 / Gin)        │
│                                         │
│  Routes:                                │
│  GET /api/topology/:id  ──direct──►──┐  │
│  GET /api/topology_exits/:id ─────►──┤  │
│  ANY /api/* ────────────proxy──────►─┘  │
└────────────────────┬────────────────────┘
                     │ HTTP :8081
                     ▼
┌─────────────────────────────────────────┐
│  wcs-java-service  (Spring Boot 3.2.3)  │
│                                         │
│  SorterController    /api/sorters       │
│  TopologyController  /api/topology*     │
│  SorterService       (business logic)   │
│  TopologyValidator   (semantic rules)   │
│  GlobalExceptionHandler                 │
└────────────────────┬────────────────────┘
                     │ JDBC :3306
                     ▼
┌─────────────────────────────────────────┐
│  MySQL 8.0  (wcs_db)                    │
│  sorters table (1 table, JSON cols)     │
└─────────────────────────────────────────┘
                     │
                     ▼ OTLP/HTTP :4318 (local dev)
┌─────────────────────────────────────────┐
│  OTel Collector (local dev only)        │
│  → debug exporter (stdout)              │
└─────────────────────────────────────────┘
```

### Request Flow for CRUD (POST /api/sorters)

```
Client
  │ POST /api/sorters
  ▼
Go Gateway (ProxyToJava)
  │ Transparent reverse proxy
  ▼
Spring SorterController (@PostMapping)
  │ @Valid → MethodArgumentNotValidException if invalid
  ▼
TopologyValidator.validate(payload)
  │ TopologyValidationException if semantic error
  ▼
SorterService.createSorter(payload)
  │ existsBySorterId → ResponseStatusException(409) if duplicate
  │ generateId() → 12-char UUID fragment
  │ toJson(nodes), toJson(edges), toJson(constraints)
  ▼
SorterRepository.save(sorter)
  │ @PrePersist → set createdAt + updatedAt
  ▼
Return SorterDetail → 201 Created
```

### Request Flow for Exit Nodes (GET /api/topology_exits/:id)

```
Client
  │ GET /api/topology_exits/SORTER-001
  ▼
Go Gateway (GetTopologyExits handler — direct)
  │ Records OTel metric: wcs.gateway.requests.total (operation=get_topology_exits)
  │ JavaClient.Get(ctx, "/api/topology_exits/SORTER-001")
  ▼
Spring TopologyController.getTopologyExits()
  ▼
SorterService.getTopologyExits(sorterId)
  │ findBySorterId() → 404 if not found
  │ parseJsonList(nodes), parseJsonList(edges)
  │ Build set of "from" node IDs from edges
  │ Exit nodes = nodes where id NOT in "from" set
  │ Return TopologyExitsResponse(exits, _meta)
  ▼
Go Gateway records duration metric
  │ Returns JSON body to client
```

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Go gateway | Gin | v1.10.0 | HTTP framework |
| Go gateway | otelgin | v0.53.0 | Gin OTel middleware |
| Go gateway | otelhttp | v0.53.0 | HTTP transport wrapper |
| Go gateway | OTel SDK | v1.28.0 | Traces + metrics |
| Java service | Spring Boot | 3.2.3 | Web + JPA + Validation |
| Java service | Java | 21 | LTS runtime |
| Java service | Hibernate | (managed) | JPA ORM |
| Java service | Flyway | (managed) | DB migration |
| Java service | Lombok | (managed) | Code generation |
| Java service | logstash-logback-encoder | 7.4 | Structured JSON logs |
| Java service | OTel Java agent | 2.5.0 | Auto-instrumentation |
| Database | MySQL | 8.0 | InnoDB, utf8mb4 |
| Containerization | Docker | multi-stage | Build + runtime separation |
| Local orchestration | Docker Compose | — | 5 services |

---

## 3. API Reference

### Base URLs

| Environment | Go Gateway | Java Service (internal) |
|-------------|-----------|------------------------|
| Local (Docker) | http://localhost:8080 | http://localhost:8081 |
| Fury (planned) | https://<fury-domain> | Internal (not exposed) |

### Endpoints

#### GET /api/sorters
- **Controller**: SorterController.listSorters()
- **Response**: `200 OK`
- **Body**: `Array<SorterSummary>`
- **No pagination** (returns all records)

#### GET /api/sorters/{sorterId}
- **Controller**: SorterController.getSorter(sorterId)
- **Path param**: `sorterId` — business identifier (VARCHAR 64)
- **Response**: `200 OK` → SorterDetail | `404` ProblemDetail

#### POST /api/sorters
- **Controller**: SorterController.createSorter(@Valid @RequestBody payload)
- **Request body**: TopologyPayload (see § 5)
- **Validation**: Bean Validation + TopologyValidator
- **Response**: `201 Created` → SorterDetail | `400` | `409` | `422` ProblemDetail

#### PUT /api/sorters/{sorterId}/topology
- **Controller**: SorterController.updateTopology(sorterId, @Valid @RequestBody payload)
- **Path param**: `sorterId`
- **Request body**: TopologyPayload
- **Validation**: Bean Validation + TopologyValidator
- **Updated fields**: sorter_name, constraints, nodes, edges, updated_at (id and created_at are immutable)
- **Response**: `200 OK` → SorterDetail | `400` | `404` | `422` ProblemDetail

#### DELETE /api/sorters/{sorterId}
- **Controller**: SorterController.deleteSorter(sorterId)
- **Path param**: `sorterId`
- **Response**: `204 No Content` | `404` ProblemDetail

#### GET /api/topology/{sorterId}
- **Controller**: TopologyController.getTopology(sorterId)
- **Response**: `200 OK` → TopologyResponse | `404` ProblemDetail

#### GET /api/topology_exits/{sorterId}
- **Controller**: TopologyController.getTopologyExits(sorterId)
- **Algorithm**: Leaf nodes = nodes with no outgoing edge (not in any edge's `from` field)
- **Response**: `200 OK` → TopologyExitsResponse | `404` ProblemDetail

---

## 4. Data Schemas

### TopologyPayload (Request)

```json
{
  "sorter_id": "string (required, max 64)",
  "sorter_name": "string (required, max 128)",
  "global_constraints": {
    "max_tu_weight_kg": "number (optional, >0 and <=200 if present)",
    "max_tu_dimensions_cm": {
      "length": "number (optional, >0 if present)",
      "width": "number (optional, >0 if present)",
      "height": "number (optional, >0 if present)"
    }
  },
  "nodes": [
    {
      "id": "string (unique within topology)",
      "name": "string",
      "type": "string",
      "capacity": "number"
    }
  ],
  "edges": [
    {
      "id": "string",
      "from": "string (node id)",
      "to": "string (node id)",
      "distance_m": "number (>=0)",
      "max_throughput_tu_per_min": "number (>0)"
    }
  ]
}
```

### SorterSummary (Response)

```json
{
  "id": "string (12 chars)",
  "sorter_id": "string",
  "sorter_name": "string",
  "node_count": "integer",
  "edge_count": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### SorterDetail (Response)

```json
{
  "id": "string (12 chars)",
  "sorter_id": "string",
  "sorter_name": "string",
  "global_constraints": "object | null",
  "nodes": "array",
  "edges": "array",
  "node_count": "integer",
  "edge_count": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### TopologyResponse (Response)

```json
{
  "id": "string",
  "sorter_id": "string",
  "sorter_name": "string",
  "global_constraints": "object | null",
  "nodes": "array",
  "edges": "array",
  "_meta": {
    "node_count": "integer",
    "edge_count": "integer",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

### TopologyExitsResponse (Response)

```json
{
  "sorter_id": "string",
  "sorter_name": "string",
  "exits": [
    { "id": "string", "name": "string", "capacity": "number" }
  ],
  "_meta": {
    "total_nodes": "integer",
    "exit_count": "integer"
  }
}
```

### ProblemDetail (Error — RFC 9457)

```json
{
  "type": "about:blank",
  "title": "string",
  "status": "integer",
  "detail": "string",
  "instance": "string (URI)",
  "errors": ["string"] // optional, present for 422
}
```

---

## 5. Validation Architecture

### Layer 1: Bean Validation (Jakarta)

Applied via `@Valid` on `@RequestBody` in controllers.
Handled by `GlobalExceptionHandler.handleBeanValidation()` → `400 Bad Request`.

| Field | Constraint |
|-------|-----------|
| TopologyPayload.sorterId | @NotBlank, @Size(max=64) |
| TopologyPayload.sorterName | @NotBlank, @Size(max=128) |
| TopologyPayload.nodes | @NotNull, @Size(max=500) |
| TopologyPayload.edges | @NotNull, @Size(max=2000) |

### Layer 2: Semantic Validation (TopologyValidator)

Applied explicitly in `SorterService.createSorter()` and `SorterService.updateTopology()`.
Throws `TopologyValidationException(List<String> errors)` → handled as `422 Unprocessable Entity`.

| Rule | Logic |
|------|-------|
| Rule 1 | `nodes.isEmpty()` → error |
| Rule 2 | `max_tu_weight_kg != null && (v <= 0 || v > 200)` → error |
| Rule 3 | any `max_tu_dimensions_cm` value `<= 0` → error |
| Rule 4 | `nodeIds.size() != nodes.size()` (duplicate detection via Set) → error |
| Rule 5 | `distance_m != null && distance_m < 0` → error |
| Rule 6 | `max_throughput_tu_per_min != null && max_throughput_tu_per_min <= 0` → error |

---

## 6. Database

### Schema

**Table**: `sorters` (MySQL 8.0, InnoDB, utf8mb4_unicode_ci)

| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR(12) | PRIMARY KEY, NOT NULL |
| sorter_id | VARCHAR(64) | NOT NULL, UNIQUE |
| sorter_name | VARCHAR(128) | NOT NULL |
| constraints | JSON | NULL |
| nodes | JSON | NULL |
| edges | JSON | NULL |
| created_at | DATETIME(6) | NOT NULL |
| updated_at | DATETIME(6) | NOT NULL |

### JPA Repository Methods

| Method | Query |
|--------|-------|
| `findBySorterId(String)` | Derived query: SELECT * WHERE sorter_id = ? |
| `existsBySorterId(String)` | Derived query: SELECT COUNT(*) > 0 WHERE sorter_id = ? |
| `findAll()` | SELECT * (inherited from JpaRepository) |
| `save(Sorter)` | INSERT / UPDATE (inherited) |
| `delete(Sorter)` | DELETE (inherited) |

### ID Generation

```java
UUID.randomUUID().toString().replace("-", "").substring(0, 12)
```
Produces a 12-char alphanumeric string. Application-side generation (not DB auto-increment).

---

## 7. Go Gateway Implementation

### Handler Architecture

```go
type Handler struct {
    javaClient *client.JavaClient   // Direct HTTP calls
    proxy      *httputil.ReverseProxy // Transparent proxy
    metrics    *telemetry.WcsMetrics  // OTel instruments
}
```

### Direct vs Proxy Routes

| Route | Method | Reason for direct call |
|-------|--------|----------------------|
| /api/topology/:sorterId | GetTopology | OTel metrics per operation |
| /api/topology_exits/:sorterId | GetTopologyExits | OTel metrics per operation |
| /api/* (all others) | ProxyToJava | Transparent, no transformation needed |

### HTTP Client Configuration

```go
Timeout:            10 seconds
Transport:          otelhttp.NewTransport(http.DefaultTransport)
MaxIdleConns:       100
MaxIdleConnsPerHost: 20
```

### OTel Instruments (wcs-go-service)

| Instrument | Type | Unit | Labels |
|-----------|------|------|--------|
| wcs.gateway.requests.total | Counter | {request} | operation |
| wcs.gateway.request.duration_ms | Histogram | ms | operation |
| wcs.gateway.upstream_errors.total | Counter | {error} | operation |

---

## 8. Observability

### Distributed Tracing

- **Go**: OTel SDK v1.28.0, OTLP/HTTP exporter, W3C TraceContext propagator
- **Java**: OTel Java agent v2.5.0 (auto-instruments Spring MVC, JDBC, Logback)
- **Propagation**: W3C Trace-Context + Baggage (end-to-end Go → Java)
- **Sampler**: AlwaysSample (Go, configurable via `OTEL_TRACES_SAMPLER` env var)

### Structured Logging

**Go**:
- `slog` with `JSONHandler` to stdout
- `TraceHandler` wrapper injects `trace_id` + `span_id` into each log record

**Java**:
- Logback with `LogstashEncoder` (JSON)
- Dev: human-readable console with MDC trace_id + span_id
- Production: JSON with max 20 throwable frames

### Metrics

| Metric | Service | Type |
|--------|---------|------|
| wcs.gateway.requests.total | wcs-go-service | Counter |
| wcs.gateway.request.duration_ms | wcs-go-service | Histogram |
| wcs.gateway.upstream_errors.total | wcs-go-service | Counter |
| Spring MVC request metrics | wcs-java-service | Auto (OTel agent) |
| JDBC query metrics | wcs-java-service | Auto (OTel agent) |

---

## 9. Deployment

### Local Development

```bash
docker compose up --build
```
Services: go-service (:8080), java-service (:8081), mysql (:3306), otel-collector (:4317, :4318)

### Fury Production (Pending)

Required steps:
1. Replace Dockerfile base images with Fury images (`hub.furycloud.io/mercadolibre/fury_*`)
2. Run `fury app create wcs-java-service` and `fury app create wcs-go-service`
3. Provision MySQL via Fury Database service
4. Create Fury Secrets: `WCS_DB_URL`, `WCS_DB_USERNAME`, `WCS_DB_PASSWORD`
5. Map secrets to env vars: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
6. Run `fury test --app wcs-java-service` and `fury test --app wcs-go-service`

### Go Service Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| PORT | No | 8080 | HTTP listen port |
| JAVA_SERVICE_URL | Yes (prod) | http://localhost:8081 | Upstream Java URL |
| SCOPE | No | development | Deployment scope |
| OTEL_SERVICE_NAME | No | wcs-go-service | OTel service name |
| OTEL_SERVICE_VERSION | No | 1.0.0 | OTel version |
| OTEL_EXPORTER_OTLP_ENDPOINT | Yes (prod) | http://localhost:4317 | OTel collector |
| OTEL_EXPORTER_OTLP_PROTOCOL | No | http/protobuf | OTLP protocol |
| OTEL_TRACES_SAMPLER | No | — | Trace sampling |

### Java Service Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| PORT | No | 8081 | HTTP listen port |
| SPRING_DATASOURCE_URL | Yes (prod) | — | MySQL JDBC URL |
| SPRING_DATASOURCE_USERNAME | Yes (prod) | — | DB username |
| SPRING_DATASOURCE_PASSWORD | Yes (prod) | — | DB password |
| SPRING_PROFILES_ACTIVE | No | development | Spring profile |
| OTEL_EXPORTER_OTLP_ENDPOINT | Yes (prod) | — | OTel collector |

---

## 10. Test Coverage

| Test Class | Type | Tests | Coverage |
|-----------|------|-------|---------|
| SorterServiceTest | Unit (Mockito) | 10 | SorterService all methods |
| SorterControllerTest | Integration (MockMvc) | 8 | SorterController all endpoints |
| TopologyValidatorTest | Unit | 7 | All 6 validation rules + happy path |
| **Total** | | **25** | |

### Known Gaps

- TopologyController endpoints lack dedicated controller-layer tests
- No integration tests against real MySQL (only unit + MockMvc)
- No load/performance tests defined

---

## 11. Known Issues & Technical Debt

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| TD-001 | WARNING | `id` generated by truncated UUID (collision risk at scale) | SorterService.generateId() |
| TD-002 | WARNING | CORS allows all origins (`*`) | WebConfig.java |
| TD-003 | INFO | OTel sampler is AlwaysSample (should use ratio in prod) | go-service/telemetry/otel.go |
| TD-004 | INFO | No JSON Schema validation for nodes/edges fields | TopologyValidator |
| TD-005 | INFO | go.sum not committed | go-service/ |
| TD-006 | INFO | Docker images use public base (not Fury registry) | Both Dockerfiles |
| TD-007 | INFO | No OpenAPI spec auto-generation configured | java-service/pom.xml |
