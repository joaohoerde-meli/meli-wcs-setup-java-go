# PATTERNS.md — WCS Topology Setup

**Generated**: 2026-02-26
**Repository size**: Small (<10k LOC) → max 10 patterns
**Source**: Code analysis only

---

## Catalog

| # | Pattern | Category |
|---|---------|----------|
| 1 | RFC 9457 ProblemDetail Error Response | HTTP/API |
| 2 | Two-Layer Validation (Bean + Semantic) | HTTP/API |
| 3 | Direct + Proxy Routing in Go Gateway | HTTP/API |
| 4 | JSON Column Stored as String in JPA | Database |
| 5 | Application-Side ID Generation | Database |
| 6 | OTel Trace + Log Correlation via TraceHandler | Observability |
| 7 | otelhttp Transport Wrapping | Observability |
| 8 | Flyway with `validate` ddl-auto | Database |
| 9 | Fury Secrets via Environment Variables | Security |
| 10 | Java Record DTOs | HTTP/API |

---

## Patterns

---

### 1. RFC 9457 ProblemDetail Error Response

**Category**: HTTP/API

**Evidence**: Used in:
- `java-service/src/main/java/com/meli/wcs/exception/GlobalExceptionHandler.java` (all handlers)
- `java-service/src/test/java/com/meli/wcs/controller/SorterControllerTest.java` (assertion on error shape)

**Example**:
```java
@ExceptionHandler(TopologyValidationException.class)
public ProblemDetail handleTopologyValidation(TopologyValidationException ex) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Topology validation failed"
    );
    problem.setProperty("errors", ex.getErrors());
    return problem;
}
```

**When to use**: For all REST error responses. Provides a consistent `{ type, title, status, detail, errors }` shape. Use `422` for semantic domain errors with a list of violations.

---

### 2. Two-Layer Validation (Bean Validation + Semantic Validator)

**Category**: HTTP/API

**Evidence**: Used in:
- `java-service/src/main/java/com/meli/wcs/controller/SorterController.java` (Layer 1: @Valid)
- `java-service/src/main/java/com/meli/wcs/service/SorterService.java` (Layer 2: topologyValidator.validate())
- `java-service/src/main/java/com/meli/wcs/validation/TopologyValidator.java` (semantic rules)

**Example**:
```java
// Layer 1: Bean Validation in Controller
@PostMapping
public ResponseEntity<SorterDetail> createSorter(
    @Valid @RequestBody TopologyPayload payload) { ... }

// Layer 2: Semantic Validation in Service
topologyValidator.validate(payload);  // throws TopologyValidationException
```

**When to use**: Use Bean Validation (`@NotBlank`, `@Size`) for structural constraints. Use a dedicated `*Validator` component for domain-specific, cross-field, or graph-level rules that cannot be expressed with annotations.

---

### 3. Direct + Proxy Routing in Go Gateway

**Category**: HTTP/API

**Evidence**: Used in:
- `go-service/cmd/main.go` (route registration)
- `go-service/internal/handlers/handlers.go` (GetTopology, GetTopologyExits, ProxyToJava)

**Example**:
```go
// Direct: custom handler with OTel metrics
r.GET("/api/topology/:sorterId", h.GetTopology)
r.GET("/api/topology_exits/:sorterId", h.GetTopologyExits)

// Proxy: transparent forward for all other routes
r.Any("/api/*path", h.ProxyToJava)
```

**When to use**: When the gateway needs observability (metrics, circuit breaking) on specific high-traffic paths while transparently forwarding all other requests. Avoids duplicating logic while still allowing targeted instrumentation.

---

### 4. JSON Column Stored as String in JPA

**Category**: Database

**Evidence**: Used in:
- `java-service/src/main/java/com/meli/wcs/model/Sorter.java` (constraints, nodes, edges fields)
- `java-service/src/main/java/com/meli/wcs/service/SorterService.java` (toJson/parseJson/parseJsonList helpers)

**Example**:
```java
// Entity
@Column(columnDefinition = "JSON")
private String nodes;  // Stored as raw JSON string

// Service — serialize
entity.setNodes(objectMapper.writeValueAsString(payload.nodes()));

// Service — deserialize
List<JsonNode> nodes = objectMapper.readValue(entity.getNodes(),
    new TypeReference<List<JsonNode>>() {});
```

**When to use**: When storing flexible, schema-less arrays or objects in MySQL. Avoids a separate child table for dynamic structures. Use only when the content does not need to be indexed or queried at field level.

---

### 5. Application-Side ID Generation

**Category**: Database

**Evidence**: Used in:
- `java-service/src/main/java/com/meli/wcs/service/SorterService.java:generateId()`
- `java-service/src/main/java/com/meli/wcs/model/Sorter.java` (@Id, VARCHAR(12))

**Example**:
```java
private String generateId() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
}
```

**When to use**: When you need a short, application-controlled primary key. Note: truncated UUID has higher collision probability at scale. For larger datasets, prefer full UUID or database-generated sequences.

---

### 6. OTel Trace + Log Correlation via TraceHandler

**Category**: Observability

**Evidence**: Used in:
- `go-service/internal/telemetry/slog.go` (TraceHandler.Handle)
- `go-service/cmd/main.go` (logger setup with TraceHandler wrapping)

**Example**:
```go
type TraceHandler struct { inner slog.Handler }

func (h *TraceHandler) Handle(ctx context.Context, r slog.Record) error {
    if span := trace.SpanFromContext(ctx); span.IsRecording() {
        sc := span.SpanContext()
        r.AddAttrs(
            slog.String("trace_id", sc.TraceID().String()),
            slog.String("span_id", sc.SpanID().String()),
        )
    }
    return h.inner.Handle(ctx, r)
}
```

**When to use**: Wrap any `slog.Handler` with `TraceHandler` to automatically inject `trace_id` and `span_id` into every log record. Enables log-to-trace correlation in Datadog, Grafana, etc.

---

### 7. otelhttp Transport Wrapping

**Category**: Observability

**Evidence**: Used in:
- `go-service/internal/client/java_client.go` (NewJavaClient)

**Example**:
```go
httpClient := &http.Client{
    Timeout: 10 * time.Second,
    Transport: otelhttp.NewTransport(http.DefaultTransport),
}
```

**When to use**: Wrap `http.Client` transport with `otelhttp.NewTransport` to automatically create child spans for every outbound HTTP call. Provides end-to-end distributed tracing without manually starting spans.

---

### 8. Flyway with `validate` ddl-auto

**Category**: Database

**Evidence**: Used in:
- `java-service/src/main/resources/application.yml`
- `java-service/src/main/resources/application-production.yml`
- `java-service/src/main/resources/db/migration/V1__initial_schema.sql`

**Example**:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate      # Never auto-modify schema
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true  # Dev only; false in prod
```

**When to use**: Always prefer `ddl-auto: validate` over `create` or `update` in any environment with real data. Flyway owns schema changes via versioned SQL files. Hibernate only validates that entities match the actual schema.

---

### 9. Fury Secrets via Environment Variables

**Category**: Security

**Evidence**: Used in:
- `java-service/src/main/resources/application-production.yml`
- `go-service/internal/config/config.go`

**Example**:
```yaml
# application-production.yml
spring.datasource:
  url: ${SPRING_DATASOURCE_URL}
  username: ${SPRING_DATASOURCE_USERNAME}
  password: ${SPRING_DATASOURCE_PASSWORD}
```

```go
// config.go
JavaServiceURL: getEnvOrDefault("JAVA_SERVICE_URL", "http://localhost:8081"),
```

**When to use**: Always inject secrets via environment variables, never hardcode. On Fury, create secrets with `fury secret create` and map them to environment variable names in the Fury deployment config.

---

### 10. Java Record DTOs

**Category**: HTTP/API

**Evidence**: Used in:
- `java-service/src/main/java/com/meli/wcs/dto/SorterSummary.java`
- `java-service/src/main/java/com/meli/wcs/dto/SorterDetail.java`
- `java-service/src/main/java/com/meli/wcs/dto/TopologyPayload.java`
- `java-service/src/main/java/com/meli/wcs/dto/TopologyResponse.java`
- `java-service/src/main/java/com/meli/wcs/dto/TopologyExitsResponse.java`

**Example**:
```java
public record SorterSummary(
    String id,
    @JsonProperty("sorter_id") String sorterId,
    @JsonProperty("sorter_name") String sorterName,
    @JsonProperty("node_count") int nodeCount,
    @JsonProperty("edge_count") int edgeCount,
    @JsonProperty("created_at") LocalDateTime createdAt,
    @JsonProperty("updated_at") LocalDateTime updatedAt
) {}
```

**When to use**: Use Java `record` for all immutable DTOs (request/response). Records provide free `equals`, `hashCode`, `toString`, and constructor. Use `@JsonProperty` on components for snake_case serialization.
